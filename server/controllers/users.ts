import { Request, Response } from "express";
import {
  createUser,
  getUserByEmailOrUsername,
  getUserByResetToken,
  getUserByUsername,
  setUserResetToken,
  updateUserPassword,
} from "../database/users";
import {
  ForgotPasswordData,
  GetUserData,
  LoginUserData,
  RegisterUserData,
  ResetPasswordData,
  ValidateResetPasswordTokenData,
} from "../validators/users";
import * as Cookies from "./utils/cookies";
import * as bcrypt from "bcrypt";
import { DatabaseError, exclude } from "../database/utils";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "@prisma/client";
import { excludedUserProps } from "./utils/users";
import Debug from "debug";
const debug = Debug("itec404");
export async function register(req: Request, res: Response) {
  const user = RegisterUserData.safeParse(req.body);

  if (!user.success) {
    return res.status(400).json({
      message: user.error.errors[0].message,
    });
  }

  if (user.data.password !== user.data.passwordConfirm) {
    return res.status(400).json({
      message: "Passwords don't match",
    });
  }

  const hash = await bcrypt.hash(user.data.password, 10);

  const userData = {
    ...user.data,
    password: hash,
  };
  const error = await createUser(userData);

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  }

  return res.status(201).json({
    message:
      "Account created successfully, You'll be contacted by email if your account is approved",
  });
}

export async function login(req: Request, res: Response) {
  const data = LoginUserData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({
      message: data.error.errors[0].message,
    });
  }

  const user = await getUserByEmailOrUsername(data.data.username);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isCorrectPassword = await bcrypt.compare(
    data.data.password,
    user.password
  );

  debug(`isCorrectPassword: ${isCorrectPassword}`);

  if (!isCorrectPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.approved) {
    return res
      .status(423)
      .json({ message: "Your account is pending approval" });
  }

  if (user.restricted) {
    return res.status(423).json({ message: "Your account is restricted" });
  }

  if (user.twoFactorAuth) {
    await Cookies.setLoginSession(res, user, true);
    return res.status(200).json({
      message: "Please input your 2FA passcode",
      requiresTwoFactorAuth: true,
    });
  }

  await Cookies.setLoginSession(res, user);

  return res.status(200).json({
    message: "Logged in successfully",
    user,
    requiresTwoFactorAuth: false,
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const data = ForgotPasswordData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const user = await getUserByEmailOrUsername(data.data.email);

  if (!user) {
    return res.status(200).json({
      message:
        "An email containing instructions on how to reset your password has been sent to you",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 3600 * 1000);

  const error = await setUserResetToken(user.id, token, tokenExpiry);
  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  }

  const transporter = nodemailer.createTransport({
    auth: {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      type: "OAuth2",
      user: process.env.GMAIL_EMAIL,
    },
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
  });

  const mailOptions = {
    from: "EMU Social",
    html: `<p>The password reset link you requested is ready. Please click on the link below to reset your password</p>\
            <a href="http://${req.headers.host}/reset-password?token=${token}">http://${req.headers.host}/reset-password?token=${token}</a>\
            <p><b>Note: This link expires in 1 hour</b></p>\
            <p>If you did not request this link, ignore this email and your password will remain unchanged</p>`,
    sender: "EMU Social",
    subject: "EMU Social Password Reset",
    to: user.email,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      return res.status(500).json({
        message: "An internal error occurred while sending the email",
      });
    }

    return res.status(200).json({
      message:
        "An email containing instructions on how to reset your password has been sent to you",
    });
  });
}

export async function validateResetPasswordToken(req: Request, res: Response) {
  const data = ValidateResetPasswordTokenData.safeParse(req.query);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const { token } = data.data;

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token is either invalid or expired" });
  }

  const user = await getUserByResetToken(token);

  if (!user) {
    return res
      .status(403)
      .json({ message: "Token is either invalid or expired" });
  }

  const u = exclude<User, keyof User>(user, ...excludedUserProps);

  return res.status(200).json({ message: "Successfully found user", user: u });
}

export async function resetPassword(req: Request, res: Response) {
  const data = ResetPasswordData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  if (data.data.password !== data.data.passwordConfirm) {
    return res.status(400).json({ message: "Passwords don't match" });
  }

  const hash = await bcrypt.hash(data.data.password, 10);

  const error = await updateUserPassword(hash, data.data.token);

  switch (error) {
    case DatabaseError.UNKNOWN:
      return res
        .status(500)
        .json({ message: "An internal error has occurred" });
    case DatabaseError.NOT_FOUND:
      return res
        .status(403)
        .json({ message: "Token is either invalid or expired" });
    default:
    case DatabaseError.SUCCESS:
      return res
        .status(200)
        .json({ message: "Your password has been successfully reset" });
  }
}

export function logout(_: Request, res: Response) {
  Cookies.removeTokenCookie(res);
  return res.status(200).json({ message: "Logged out" });
}

export async function validateToken(req: Request, res: Response) {
  return res.status(200).json({ user: req.session.user });
}

export async function getUser(req: Request, res: Response) {
  const data = GetUserData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const user = await getUserByUsername(data.data.username);

  if (!user) {
    return res.status(404).json({ message: "User doesn't exist" });
  }

  let u = user;

  if (req.session.user.id !== user.id) {
    if (!u.settings?.showRealName) {
      u = exclude(u, "name", "surname");
    }

    if (!u.settings?.showEmail) {
      u = exclude(u, "email");
    }
  }

  return res
    .status(200)
    .json({ message: "Successfully fetched user", user: u });
}
