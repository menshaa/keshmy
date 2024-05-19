import { Container, Stack } from "@chakra-ui/react";
import { ReactElement } from "react";
import LoginForm from "src/components/LoginForm";

export default function Login(): ReactElement {
    return (
        <Stack justify="center" align="center">
            <Container maxWidth="md" my={12}>
                <LoginForm />
            </Container>
        </Stack>
    );
}

Login.defaultProps = {
    noAuthPage: true,
};
