import { Container, Stack } from "@chakra-ui/react";
import { ReactElement } from "react";
import ForgotPasswordForm from "src/components/ForgotPasswordForm";

export default function ForgotPassword(): ReactElement {
    return (
        <Stack justify="center" align="center" bgColor="bgMain">
            <Container maxWidth="lg" my={12}>
                <ForgotPasswordForm />
            </Container>
        </Stack>
    );
}

ForgotPassword.defaultProps = {
    noAuthPage: true,
};
