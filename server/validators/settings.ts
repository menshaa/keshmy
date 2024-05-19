import z from "zod";

export const ToggleShowRealNameData = z.object({
    showRealName: z.boolean(),
});

export const ToggleShowEmailData = z.object({
    showEmail: z.boolean(),
});

export const ToggleAllowAllDMsData = z.object({
    allowAllDMs: z.boolean(),
});

export const ToggleReadReceiptsData = z.object({
    readReceipts: z.boolean(),
});

export const ChangePasswordData = z.object({
    currentPassword: z.string().min(1, "Current password cannot be empty"),
    newPassword: z.string().min(8, "Password is too short, at least 8 characters are required"),
    newPasswordConfirm: z.string().min(8, "Password confirmation is too short, at least 8 characters are required"),
});

export const Enable2FAData = z.object({
    passcode: z.string().length(6, "Passcode must be 6 digits"),
});

export const VerifyTOTPCodeData = z.object({
    passcode: z.string().length(6, "Passcode must be 6 digits"),
});

export const UpdateProfileData = z.object({
    name: z.string(),
    surname: z.string(),
    username: z.string()
}).partial();
