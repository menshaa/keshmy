import { Container, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ResetPasswordForm from "src/components/ResetPasswordForm";
import { IUser } from "src/types/interfaces";
import { ValidateResetPasswordTokenRes } from "src/types/server";
import { axiosNoAuth } from "src/utils/axios";

export default function ResetPassword(): ReactElement {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<IUser | null>(null);
    const [token, setToken] = useState("");

    useEffect(() => {
        if (router.query.token) {
            setToken(router.query.token as string);

            axiosNoAuth.get<ValidateResetPasswordTokenRes>(`users/validate-reset-password-token?token=${router.query.token}`)
                .then((res) => {
                    setUser(res.data.user);
                    setLoading(false);
                })
                .catch((e) => {
                    toast.error(e?.response?.data?.message ?? "An error has occurred");
                    router.replace("/forgot-password");
                });
        }
    }, [router]);

    return (
        <Stack justify="center" align="center" bgColor="bgMain">
            <Container maxWidth="lg" my={12}>
                <ResetPasswordForm user={user} loading={loading} token={token} />
            </Container>
        </Stack>
    );
}

ResetPassword.defaultProps = {
    noAuthPage: true,
};
