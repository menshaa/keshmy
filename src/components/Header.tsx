import {
    Button,
    Container,
    HStack,
    Image,
    Stack,
    Text,
    Link as ChakraLink,
    LinkOverlay,
    LinkBox,
    Flex,
    Box,
    IconButton,
    Icon,
    Menu,
    MenuButton,
    ChakraComponent,
    MenuButtonProps,
    MenuItem,
    MenuList,
    MenuDivider,
    BoxProps,
    useDisclosure,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    Portal,
    VStack,
    useColorMode,
} from "@chakra-ui/react";
import { ReactElement, useRef } from "react";
import NextLink from "next/link";
import SearchBar from "src/components/SearchBar";
import { DrawerNavItem } from "src/components/NavItem";
import {
    BriefcaseIcon,
    CalendarIcon,
    NewspaperIcon,
    ChatAlt2Icon,
    CogIcon,
    UserIcon as UserIconSolid,
    LogoutIcon as LogoutIconSolid,
    MoonIcon as MoonIconSolid,
    SunIcon as SunIconSolid,
} from "@heroicons/react/solid";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    UserIcon as UserIconOutline,
    CogIcon as CogIconOutline,
    LogoutIcon,
    MoonIcon as MoonIconOutline,
    SunIcon as SunIconOutline,
} from "@heroicons/react/outline";
import { Gauge, Megaphone, Pizza } from "phosphor-react";
import Router from "next/router";
import { useUserContext } from "src/contexts/userContext";
import { IUser } from "src/types/interfaces";
import { axiosAuth } from "src/utils/axios";
import Avatar from "src/components/Avatar";

const PizzaIcon = () => {
    return <Pizza size="26" weight="fill" />;
};

const DashboardIcon = () => {
    return <Gauge size="26" weight="fill" />;
};

const drawerLinksItems = [
    {
        href: "/jobs",
        icon: BriefcaseIcon,
        title: "Jobs",
        adminOnly: false,
    },
    {
        href: "/events",
        icon: CalendarIcon,
        title: "Events",
        adminOnly: false,
    },
    {
        href: "/articles",
        icon: NewspaperIcon,
        title: "Articles",
        adminOnly: false,
    },
    {
        href: "/cafeteria",
        icon: PizzaIcon,
        title: "Cafeteria",
        adminOnly: false,
    },
    {
        href: "/dashboard",
        icon: DashboardIcon,
        title: "Admin Dashboard",
        adminOnly: true,
    },
];

interface UserDropDownCardButtonProps {
    isOpen: boolean;
    user: IUser | null;
}

interface UserDropDownProps {
    user: IUser | null;
}

interface UserDrawerProps {
    user: IUser | null;
}


type CustomMenuButton = ChakraComponent<"button", UserDropDownCardButtonProps>;
type CustomBox = ChakraComponent<"div", UserDropDownProps>;

const MegaphoneIcon = () => {
    return <Megaphone size="40" weight="fill" />;
};

const UserDropDownCardButton = ((
    props: MenuButtonProps & UserDropDownCardButtonProps,
) => {
    return (
        <MenuButton
            height="full"
            as={Button}
            variant="ghost"
            pl={0}
            rightIcon={
                <Icon
                    as={props.isOpen ? ChevronUpIcon : ChevronDownIcon}
                    w="22px"
                    h="22px"
                />
            }
        >
            <HStack>
                <Avatar src={props.user?.avatarURL} rounded="lg" width="55px" height="55px" />
                <Text display={{ md: "none", lg: "initial" }}>{props.user?.name} {props.user?.surname}</Text>
            </HStack>
        </MenuButton>
    );
}) as CustomMenuButton;

const UserDropDown = ((props: BoxProps & UserDropDownProps) => {
    const { logout } = useUserContext();
    const { colorMode, toggleColorMode } = useColorMode();

    const _logout = async () => {
        await axiosAuth.delete("users/logout");
        logout();
    };

    return (
        <Box {...props}>
            <Menu placement="bottom-end">
                {({ isOpen }) => (
                    <>
                        <UserDropDownCardButton isOpen={isOpen} user={props.user} />
                        <Portal>
                            <MenuList zIndex={3}>
                                <NextLink href={`/@${props.user?.username}`} passHref>
                                    <MenuItem
                                        as={ChakraLink}
                                        _hover={{ textDecoration: "none" }}
                                    >
                                        <Icon
                                            mr={3}
                                            as={UserIconOutline}
                                            h="20px"
                                            w="20px"
                                        />
                                        <span>Profile</span>
                                    </MenuItem>
                                </NextLink>
                                <NextLink href="/settings" passHref>
                                    <MenuItem
                                        as={ChakraLink}
                                        _hover={{ textDecoration: "none" }}
                                    >
                                        <Icon
                                            mr={3}
                                            as={CogIconOutline}
                                            h="20px"
                                            w="20px"
                                        />
                                        <span>Settings</span>
                                    </MenuItem>
                                </NextLink>
                                <MenuItem onClick={toggleColorMode}>
                                    <Icon mr={3} as={colorMode == "light" ? MoonIconOutline : SunIconOutline} h="20px" w="20px" />
                                    <span>{colorMode == "light" ? "Dark" : "Light"} Mode</span>
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem onClick={_logout}>
                                    <Icon mr={3} as={LogoutIcon} h="20px" w="20px" />
                                    <span>Logout</span>
                                </MenuItem>
                            </MenuList>
                        </Portal>
                    </>
                )}
            </Menu>
        </Box>
    );
}) as CustomBox;

interface DrawerProfileItemsProps {
    onClose: () => void;
    username: string;
    logout: () => void;
}

const DrawerProfileItems = ({ username, logout, onClose }: DrawerProfileItemsProps) => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <>
            <DrawerNavItem
                href={`/@${username}`}
                icon={UserIconSolid}
                onClick={() => {
                    onClose();
                }}
            >
                Profile
            </DrawerNavItem>
            <DrawerNavItem
                href="/settings"
                icon={CogIcon}
                onClick={() => {
                    onClose();
                }}
            >
                Settings
            </DrawerNavItem>
            <DrawerNavItem
                href={null}
                icon={colorMode == "light" ? MoonIconSolid : SunIconSolid}
                onClick={() => {
                    toggleColorMode();
                    onClose();
                }}
            >
                {colorMode == "light" ? "Dark" : "Light"} Mode
            </DrawerNavItem>
            <DrawerNavItem
                href={null}
                icon={LogoutIconSolid}
                onClick={async () => {
                    await axiosAuth.delete("users/logout");
                    logout();
                    onClose();
                }}
            >
                Logout
            </DrawerNavItem>
        </>
    );
};

const UserDrawer = ((props: BoxProps & UserDrawerProps) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { logout } = useUserContext();
    const imageRef = useRef(null);

    return (
        <Box {...props}>
            <Avatar
                src={props.user?.avatarURL}
                rounded="lg"
                width="40px"
                height="40px"
                ref={imageRef}
                onClick={onOpen}
            />
            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                finalFocusRef={imageRef}
            >
                <DrawerOverlay />
                <DrawerContent bgColor="bgMain" maxWidth="300px">
                    <DrawerCloseButton />
                    <DrawerHeader>
                        <VStack align="start">
                            <Avatar src={props.user?.avatarURL} rounded="lg" width="45px" height="45px" />
                            <Text fontWeight="semibold">{props.user?.name} {props.user?.surname}</Text>
                        </VStack>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack spacing={6} width="full">
                            <VStack width="full" align="start">
                                <Text fontWeight="semibold">Profile</Text>
                                <DrawerProfileItems username={props.user?.username ?? ""} onClose={onClose} logout={logout} />
                            </VStack>
                            <VStack width="full" align="start">
                                <Text fontWeight="semibold">Quick Links</Text>
                                {drawerLinksItems.map((item) => {
                                    if (item.adminOnly && !props.user?.isAdmin) {
                                        return null;
                                    } else {
                                        return (
                                            <DrawerNavItem
                                                key={item.title}
                                                href={item.href}
                                                icon={item.icon}
                                                onClick={onClose}
                                            >
                                                {item.title}
                                            </DrawerNavItem>
                                        );
                                    }
                                })}
                            </VStack>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    );
}) as CustomBox;

function LoggedOutHeader(): ReactElement {
    return (
        <Stack
            bgColor="bgPrimary"
            boxShadow="header"
            position="sticky"
            top="0"
            zIndex={3}
        >
            <Container maxWidth="8xl" py={1}>
                <HStack justify="space-between">
                    <LinkBox>
                        <NextLink href="/" passHref>
                            <LinkOverlay>
                                <Image
                                    boxSize={{ base: "60px", md: "76px" }}
                                    src="/logo.png"
                                    alt="EMU Logo"
                                />
                            </LinkOverlay>
                        </NextLink>
                    </LinkBox>
                    <HStack>
                        <NextLink href="/login" passHref>
                            <Button
                                as={ChakraLink}
                                colorScheme="button"
                                variant="outline"
                                sx={{ "&:hover": { textDecoration: "none" } }}
                            >
                                Log in
                            </Button>
                        </NextLink>
                        <NextLink href="/register" passHref>
                            <Button
                                as={ChakraLink}
                                // underline="none"
                                colorScheme="button"
                                sx={{ "&:hover": { textDecoration: "none" } }}
                            >
                                Sign up
                            </Button>
                        </NextLink>
                    </HStack>
                </HStack>
            </Container>
        </Stack>
    );
}

function LoggedInHeader(): ReactElement {
    const { user } = useUserContext();

    const handleSearchSubmit = (input: HTMLInputElement | null) => {
        if (input) {
            if (Router.pathname === "/search") {
                Router.push(`/search?q=${input.value}${Router.query.type ? `&type=${Router.query.type}` : ""}`);
            } else {
                Router.push(`/search?q=${input.value}`);
            }
        }
    };

    return (
        <Stack
            bgColor="bgPrimary"
            boxShadow="header"
            position="sticky"
            top="0"
            zIndex={3}
        >
            <Container maxWidth="8xl" py={1}>
                <Flex align="center" justify="space-between">
                    <LinkBox
                        order={{ base: "2", md: "initial" }}
                        width={{ base: "initial", md: "25%" }}
                    >
                        <NextLink href="/feed" passHref>
                            <LinkOverlay
                                display="flex"
                                width="fit-content"
                                _before={{ width: "fit-content" }}
                            >
                                <Image
                                    display="inline-block"
                                    boxSize={{ base: "60px", md: "76px" }}
                                    src="/logo.png"
                                    alt="EMU Logo"
                                />
                            </LinkOverlay>
                        </NextLink>
                    </LinkBox>
                    <Box
                        display={{ base: "none", md: "initial" }}
                        width={{ md: "35%", xl: "40%" }}
                    >
                        <SearchBar withButton onSubmit={handleSearchSubmit} />
                    </Box>
                    <Flex
                        gap={7}
                        align="center"
                        marginLeft={{ md: "auto" }}
                        order={{ base: "1", md: "initial" }}
                    >
                        <HStack display={{ base: "none", md: "initial" }} spacing={3}>
                            <NextLink href="/messages" passHref>
                                <IconButton
                                    as={ChakraLink}
                                    colorScheme="button"
                                    variant="ghost"
                                    aria-label="Messages"
                                    icon={<Icon as={ChatAlt2Icon} w="40px" h="40px" />}
                                />
                            </NextLink>
                        </HStack>
                        <UserDropDown display={{ base: "none", md: "initial" }} user={user} />
                        <UserDrawer display={{ base: "initial", md: "none" }} user={user} />
                    </Flex>
                    <Box order={{ base: "3" }} display={{ base: "block", md: "none" }}>
                        <NextLink href="/announcements" passHref>
                            <IconButton
                                as={ChakraLink}
                                colorScheme="button"
                                variant="ghost"
                                aria-label="Announcements"
                                icon={<Icon as={MegaphoneIcon} w="40px" h="40px" />}
                            />
                        </NextLink>
                    </Box>
                </Flex>
            </Container>
        </Stack>
    );
}

export default function Header(): ReactElement {
    const { user } = useUserContext();

    return user ? <LoggedInHeader /> : <LoggedOutHeader />;
}
