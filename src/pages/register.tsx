import { Container, Stack } from "@chakra-ui/react";
import { ReactElement } from "react";
import RegisterForm from "src/components/RegisterForm";

export default function Register(): ReactElement {
    return (
        <Stack justify="center" align="center" bgColor="bgMain">
            <Container maxWidth="md" my={12}>
                <RegisterForm />
            </Container>
        </Stack>
    );
}

Register.defaultProps = {
    noAuthPage: true,
};
