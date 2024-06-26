import { Request, Response } from "express";
import { DatabaseError } from "../database/utils";
import { removeUserProfileImage, setTOTPSecret, toggle2FA, updateAllowAllDMsSetting, updatePassword, updateReadReceiptsSetting, updateShowEmailSetting, updateShowRealNameSetting, updateUserName, updateUserProfileImage, updateUserSurname, updateUserUsername } from "../database/settings";
import { ChangePasswordData, Enable2FAData, ToggleAllowAllDMsData, ToggleReadReceiptsData, ToggleShowEmailData, ToggleShowRealNameData, UpdateProfileData, VerifyTOTPCodeData } from "../validators/settings";
import * as Cookies from "./utils/cookies";
import bcrypt from "bcrypt";
import { getUserById } from "../database/users";
import crypto from "crypto";
import * as base32 from "hi-base32";
import { encodeUint64BE } from "./utils/2fa";
import Qrcode from "qrcode";
import fileUpload from "express-fileupload";
import fs from "fs/promises";
import z from "zod";
import { USERNAME_REGEX } from "../validators/users";

export async function toggleShowRealName(req: Request, res: Response) {
    const data = ToggleShowRealNameData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await updateShowRealNameSetting(req.session.user.id, data.data.showRealName);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal server error has occurred" });
    }

    return res.status(200).json({ message: "Successfully toggled setting" });
}

export async function toggleShowEmail(req: Request, res: Response) {
    const data = ToggleShowEmailData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await updateShowEmailSetting(req.session.user.id, data.data.showEmail);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal server error has occurred" });
    }

    return res.status(200).json({ message: "Successfully toggled setting" });
}

export async function toggleAllowAllDMs(req: Request, res: Response) {
    const data = ToggleAllowAllDMsData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await updateAllowAllDMsSetting(req.session.user.id, data.data.allowAllDMs);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal server error has occurred" });
    }

    return res.status(200).json({ message: "Successfully toggled setting" });
}

export async function toggleReadReceipts(req: Request, res: Response) {
    const data = ToggleReadReceiptsData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await updateReadReceiptsSetting(req.session.user.id, data.data.readReceipts);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal server error has occurred" });
    }

    return res.status(200).json({ message: "Successfully toggled setting" });
}

export async function changePassword(req: Request, res: Response) {
    const data = ChangePasswordData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    if (!(await bcrypt.compare(data.data.currentPassword, req.session.user.password))) {
        return res.status(401).json({ message: "Incorrect password or invalid token" });
    }

    if (data.data.newPassword !== data.data.newPasswordConfirm) {
        return res.status(400).json({ message: "Passwords don't match" });
    }

    const hash = await bcrypt.hash(data.data.newPassword, 10);

    const error = await updatePassword(req.session.user.id, hash);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal server error has occurred" });
    }

    Cookies.removeTokenCookie(res);

    return res.status(200).json({ message: "Password changed successfully" });
}

export async function generateTOTPSecret(req: Request, res: Response) {
    const secretSize = 40;
    const issuer = "EMU Social";

    const randomBytes = crypto.randomBytes(secretSize);
    const secret = base32.encode(randomBytes);

    const error = await setTOTPSecret(req.session.user.id, secret);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An error occurred while saving 2FA secret to db" });
    }

    const totpURL = new URL(`/${issuer}:${req.session.user.email}`, "otpauth://totp");
    totpURL.searchParams.set("algorithm", "SHA1");
    totpURL.searchParams.set("digits", "6");
    totpURL.searchParams.set("issuer", issuer);
    totpURL.searchParams.set("period", "30");
    totpURL.searchParams.set("secret", secret);

    const qrcode = await Qrcode.toDataURL(totpURL.toString());

    return res.status(200).json({ message: "Successfully generated a TOTP secret", secret, qrcode });
}

function validateTOTPCode(secret: string, passcode: number): boolean {
    const key = Buffer.from(base32.decode.asBytes(secret));

    // calculate passcode for 1 minute in the past,
    // the current time, and 1 minute in the future.
    for (let i = -2; i < 3; i++) {
        const tm = Math.floor((Date.now() + (i * 30 * 1000)) / 1000 / 30); // unix timestamp in seconds / 30
        const hmac = crypto.createHmac("sha1", key);
        const encodedTime = encodeUint64BE(tm);
        hmac.update(encodedTime);
        const hmacBytes = hmac.digest();
        const offset = hmacBytes[hmacBytes.length - 1] & 0x0F;
        const truncHash = hmacBytes.readUInt32BE(offset);
        const code = (truncHash & 0x7FFFFFFF) % 1000000;

        if (passcode === code) return true;
    }

    return false;
}

export async function verifyTOTPCode(req: Request, res: Response) {
    const data = VerifyTOTPCodeData.safeParse(req.body);
    const twoFASession = await Cookies.get2FASession(req);

    if (!twoFASession) {
        return res.status(401).json({ message: "Invalid authentication token, please log in" });
    }

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const passcode = parseInt(data.data.passcode);
    if (isNaN(passcode)) {
        return res.status(400).json({ message: "Passcode must be a 6 digit number" });
    }

    const user = await getUserById(twoFASession.userId);

    if (!user) {
        return res.status(401).json({ message: "Invalid authentication token, please log in" });
    }

    if (!validateTOTPCode(user.totpSecret!, passcode)) {
        return res.status(401).json({ message: "Invalid passcode" });
    }

    await Cookies.setLoginSession(res, user);

    return res.status(200).json({ message: "Logged in successfully" });
}

export async function enable2FA(req: Request, res: Response) {
    const data = Enable2FAData.safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const passcode = parseInt(data.data.passcode);
    if (isNaN(passcode)) {
        return res.status(400).json({ message: "Passcode must be a 6 digit number" });
    }

    const secret = req.session.user.totpSecret!;

    if (!validateTOTPCode(secret, passcode)) {
        return res.status(403).json({ message: "Invalid passcode" });
    }

    const error = await toggle2FA(req.session.user.id, true);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An error occurred while enabling 2FA" });
    }

    await Cookies.setLoginSession(res, req.session.user);

    return res.status(200).json({ message: "Successfully enabled 2FA" });
}

export async function disable2FA(req: Request, res: Response) {
    const error = await toggle2FA(req.session.user.id, false);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An error occurred while disabling 2FA" });
    }

    return res.status(200).json({ message: "Successfully disabled 2FA" });
}

export async function updateProfile(req: Request, res: Response) {
    const data = UpdateProfileData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    if (!data.data.name && !data.data.surname && !data.data.username && !req.files?.profileImage) {
        return res.status(400).json({ message: "At least one field has to be changed" });
    }

    if (data.data.name) {
        const error = await updateUserName(req.session.user.id, data.data.name);
        if (error === DatabaseError.UNKNOWN) {
            return res.status(500).json({ message: "An internal error occurred while updating your name" });
        }
    }

    if (data.data.surname) {
        const error = await updateUserSurname(req.session.user.id, data.data.surname);
        if (error === DatabaseError.UNKNOWN) {
            return res.status(500).json({ message: "An internal error occurred while updating your surname" });
        }
    }

    if (data.data.username) {
        const username = z.string()
            .min(3, "Username is too short, at least 3 characters are required")
            .max(16, "Username is too long, it cannot exceed 16 characters")
            .regex(USERNAME_REGEX, "Username cannot contain special characters, only letters, numbers and underscore are allowed")
            .safeParse(data.data.username);

        if (!username.success) {
            return res.status(400).json({ message: username.error.errors[0].message });
        }

        const error = await updateUserUsername(req.session.user.id, username.data);
        if (error === DatabaseError.UNKNOWN) {
            return res.status(500).json({ message: "An internal error occurred while updating your username" });
        } else if (error == DatabaseError.DUPLICATE) {
            return res.status(409).json({ message: "That username is already taken" });
        }
    }

    if (req.files?.profileImage) {
        const file = <fileUpload.UploadedFile>req.files.profileImage;

        const bytes = crypto.randomBytes(8).toString("hex");
        const fileName = `profile-${bytes}`;
        const dir = `${__dirname}/../cdn/profile-images/${req.session.user.id}`;

        const ext = file.mimetype.split("/").at(-1);
        await fs.mkdir(dir, { recursive: true });
        await file.mv(`${dir}/${fileName}.${ext}`);

        const avatarURL = `http://${req.headers.host}/cdn/profile-images/${req.session.user.id}/${fileName}.${ext}`;
        const error = await updateUserProfileImage(req.session.user.id, avatarURL);
        if (error === DatabaseError.UNKNOWN) {
            return res.status(500).json({ message: "An internal error occurred while updating your profile image" });
        }

        await fs.rm(`${dir}/${req.session.user.avatarURL?.split("/").at(-1)}`, { recursive: true, force: true });
    }

    return res.status(200).json({ message: "Successfully updated your profile" });
}

export async function removeProfileImage(req: Request, res: Response) {
    const error = await removeUserProfileImage(req.session.user.id);
    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    const oldAvatar = `${__dirname}/../cdn/profile-images/${req.session.user.id}/${req.session.user.avatarURL?.split("/").at(-1)}`;
    await fs.rm(oldAvatar, { recursive: true, force: true });

    return res.status(200).json({ message: "Successfully removed profile image" });
}
