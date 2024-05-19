import { Box, Container, Flex, useMediaQuery } from "@chakra-ui/react";
import Router, { useRouter } from "next/router";
import { PropsWithChildren, ReactElement, useEffect } from "react";
import Nav from "src/components/Nav";
import { useUserContext } from "src/contexts/userContext";
import Sidebar from "src/components/Sidebar";

const adminRoutes = [
    "/dashboard/[[...item]]"
];

const nonSidebarRoutes = [
    "/messages/[[...conversationId]]",
    "/dashboard/[[...item]]",
    "/settings/[[...setting]]",
    "/club",
];

export default function LoggedInLayout({ children }: PropsWithChildren): ReactElement {
    const { user } = useUserContext();

    const router = useRouter();
    const [isLargerThanMd] = useMediaQuery(["(min-width: 52em)"]);
    const onSettingsPage = router.pathname === "/settings/[[...setting]]";
    const onMessagesPage = router.pathname === "/messages/[[...conversationId]]";
    const onPostPage = router.pathname === "/u/[username]/[postId]";
    const fullScreenRoute = onSettingsPage || onMessagesPage || onPostPage;
    const fullScreen = fullScreenRoute && !isLargerThanMd;

    const hasSidebar = !nonSidebarRoutes.includes(router.pathname);
    const withEvents = router.pathname !== "/events";
    const withCafeteria = router.pathname !== "/cafeteria";

    useEffect(() => {
        if (!user) {
            Router.replace("/login");
            return;
        }

        if (!user.isAdmin && adminRoutes.includes(Router.pathname)) {
            Router.replace("/feed");
            return;
        }
    }, [user]);

    if (!user || (!user.isAdmin && adminRoutes.includes(Router.pathname))) return <></>;

    return (
        <Container maxWidth={fullScreen ? "full" : "8xl"} px={fullScreen ? 0 : "1rem"}>
            <Flex position="relative" gap={{ md: 12, lg: 16, xl: 24 }} align="start">
                <Nav />
                <Flex
                    gap={10}
                    flex="7"
                    flexBasis="70%"
                    mt={{ base: fullScreen && !onMessagesPage ? 0 : 5, md: 10 }}
                    mb={fullScreenRoute ? "" : { base: "5rem", md: 10 }}
                    maxWidth="full"
                    minWidth="0"
                >
                    <Box
                        flex="7"
                        maxWidth="full"
                        minWidth="0"
                    >
                        {children}
                    </Box>
                    {hasSidebar && (<Sidebar withEvents={withEvents} withCafeteria={withCafeteria} />)}
                </Flex>
            </Flex>
        </Container>
    );
}
