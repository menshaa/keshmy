export const excludedUserProps = [
    "password",
    "approved",
    "resetPasswordToken",
    "resetPasswordTokenExpiry",
    "totpSecret",
] as const;

export type ExcludedUserProps = typeof excludedUserProps[number];
