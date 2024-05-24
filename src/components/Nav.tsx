import { Box, Divider, HStack, VStack } from "@chakra-ui/react";
import {
  BriefcaseIcon,
  CalendarIcon,
  ChatAlt2Icon,
  HomeIcon,
  NewspaperIcon,
  SearchIcon,
  UserGroupIcon,
} from "@heroicons/react/solid";
import { Gauge, Megaphone, Pizza } from "phosphor-react";
import { ReactElement } from "react";
import NavItem from "src/components/NavItem";
import { useUserContext } from "src/contexts/userContext";
import styles from "src/styles/nav.module.scss";

const MegaphoneIcon = () => {
  return (
    <Megaphone size="26" style={{ transform: "scaleX(-1)" }} weight="fill" />
  );
};

const PizzaIcon = () => {
  return <Pizza size="26" weight="fill" />;
};

const DashboardIcon = () => {
  return <Gauge size="26" weight="fill" />;
};

export default function Nav(): ReactElement {
  const { user } = useUserContext();

  return (
    <Box className={styles.nav}>
      <VStack display={{ base: "none", md: "flex" }} spacing={4} my={10}>
        <NavItem href="/feed" icon={HomeIcon}>
          Home
        </NavItem>
        <NavItem href="/jobs" icon={BriefcaseIcon}>
          Jobs
        </NavItem>
        <NavItem href="/events" icon={CalendarIcon}>
          Events
        </NavItem>
        <NavItem href="/articles" icon={NewspaperIcon}>
          Articles
        </NavItem>
        <NavItem href="/announcements" icon={MegaphoneIcon}>
          Announcements
        </NavItem>
        <NavItem href="/cafeteria" icon={PizzaIcon}>
          Cafeteria
        </NavItem>
        {/* <NavItem href="/club" icon={UserGroupIcon}>
                    IT Club
                </NavItem> */}
        <NavItem href="/group" icon={UserGroupIcon}>
          Groups
        </NavItem>
        {user?.isAdmin && (
          <>
            <Divider height="1px" bgColor="bgSecondary" />
            <NavItem href="/dashboard" icon={DashboardIcon}>
              Admin Dashboard
            </NavItem>
          </>
        )}
      </VStack>
      <HStack
        justify="space-around"
        p={2}
        display={{ base: "flex", md: "none" }}
      >
        <NavItem href="/feed" ariaLabel="Home" icon={HomeIcon} />
        <NavItem href="/search" ariaLabel="Search" icon={SearchIcon} />
        <NavItem href="/messages" ariaLabel="Messages" icon={ChatAlt2Icon} />
        {/* <NavItem href="/club" ariaLabel="Club" icon={UserGroupIcon} /> */}
        <NavItem href="/group" ariaLabel="Groups" icon={UserGroupIcon} />
      </HStack>
    </Box>
  );
}
