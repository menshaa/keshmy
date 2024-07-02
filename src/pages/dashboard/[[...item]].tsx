import dynamic from "next/dynamic";
import {
  Flex,
  VStack,
  Text,
  Divider,
  Grid,
  Box,
  Button,
  Icon,
  ButtonGroup,
  LinkBox,
  LinkOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Calendar,
  Megaphone,
  NewspaperClipping,
  UserList,
} from "phosphor-react";
import { ComponentProps, ReactElement, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
const DashboardContentArea = dynamic(
  () => import("src/components/dashboard/dashboardContentArea")
);
import { DashboardItem } from "src/types/interfaces";
import AddAnnouncementModal from "src/components/AddAnnouncementModal";
import AddCafeteriaItemModal from "src/components/AddCafeteriaItemModal";
import AddArticleModal from "src/components/AddArticleModal";
import AddEventModal from "src/components/AddEventModal";
import AddJobModal from "src/components/AddJobModal";
const Accounts = dynamic(() => import("src/components/dashboard/accounts"));
const Announcements = dynamic(
  () => import("src/components/dashboard/announcements")
);
const Articles = dynamic(() => import("src/components/dashboard/articles"));
const Events = dynamic(() => import("src/components/dashboard/events"));

const cards = [
  {
    id: "accounts",
    title: "Manage Accounts",
    icon: UserListIcon,
    desc: "View and manage accounts",
    component: Accounts,
  },
  {
    id: "announcements",
    title: "Manage Announcements",
    icon: MegaphoneIcon,
    desc: "View and manage published and pending announcements",
    component: Announcements,
  },
  {
    id: "articles",
    title: "Manage Articles",
    icon: NewspaperIcon,
    desc: "View and manage published and pending articles",
    component: Articles,
  },
  {
    id: "events",
    title: "Manage Events",
    icon: CalendarIcon,
    desc: "View and manage events",
    component: Events,
  },
];

function UserListIcon(): ReactElement {
  return <UserList weight="duotone" size="100" />;
}

function MegaphoneIcon(): ReactElement {
  return <Megaphone weight="duotone" size="100" />;
}

function NewspaperIcon(): ReactElement {
  return <NewspaperClipping weight="duotone" size="100" />;
}

function CalendarIcon(): ReactElement {
  return <Calendar weight="duotone" size="100" />;
}

interface SidebarProps {
  onAnnouncementOpen: () => void;
  onJobOpen: () => void;
  onArticleOpen: () => void;
  onEventOpen: () => void;
  onCafeteriaItemOpen: () => void;
}

function Sidebar(props: SidebarProps): ReactElement {
  return (
    <VStack spacing={4} width="full" align="start">
      <VStack width="full" align="start" spacing={1}>
        <Text fontWeight="semibold">Quick Access</Text>
        <Divider height="1px" bgColor="bgSecondary" />
      </VStack>
      <ButtonGroup width="full" colorScheme="button">
        <VStack width="full">
          <Button width="full" onClick={props.onEventOpen}>
            Add Event
          </Button>
          <Button width="full" onClick={props.onJobOpen}>
            Add Job
          </Button>
          <Button width="full" onClick={props.onAnnouncementOpen}>
            Publish Announcement
          </Button>
          <Button width="full" onClick={props.onArticleOpen}>
            Publish Article
          </Button>
          <Button width="full" onClick={props.onCafeteriaItemOpen}>
            Add Cafeteria Item
          </Button>
        </VStack>
      </ButtonGroup>
    </VStack>
  );
}

interface DashboardCardProps {
  id: string;
  icon: (props: ComponentProps<"svg">) => ReactElement;
  desc: string;
}

function DashboardCard({ id, icon, desc }: DashboardCardProps): ReactElement {
  return (
    <LinkBox>
      <NextLink href={`/dashboard/${id}`} passHref>
        <LinkOverlay>
          <VStack
            as={Button}
            color="text"
            spacing={4}
            py={10}
            height="full"
            width="full"
            colorScheme="conversationItem"
          >
            <Box bgColor="bgSecondary" p={3} rounded="xl">
              <Icon as={icon} />
            </Box>
            <Text fontSize={{ base: "md", md: "lg" }} whiteSpace="normal">
              {desc}
            </Text>
          </VStack>
        </LinkOverlay>
      </NextLink>
    </LinkBox>
  );
}

export default function Dashboard(): ReactElement {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<DashboardItem | null>(null);

  const {
    isOpen: isAnnouncementOpen,
    onOpen: onAnnouncementOpen,
    onClose: onAnnouncementClose,
  } = useDisclosure();
  const {
    isOpen: isJobOpen,
    onOpen: onJobOpen,
    onClose: onJobClose,
  } = useDisclosure();
  const {
    isOpen: isArticleOpen,
    onOpen: onArticleOpen,
    onClose: onArticleClose,
  } = useDisclosure();
  const {
    isOpen: isEventOpen,
    onOpen: onEventOpen,
    onClose: onEventClose,
  } = useDisclosure();
  const {
    isOpen: isCafeteriaItemOpen,
    onOpen: onCafeteriaItemOpen,
    onClose: onCafeteriaItemClose,
  } = useDisclosure();

  useEffect(() => {
    if (router.query.item?.[0] === activeItem?.id) {
      return;
    }

    if (!router.query.item?.[0]) {
      setActiveItem(null);
      return;
    }

    if (router.query.item?.[0]) {
      setActiveItem(
        cards.find((card) => card.id === router.query.item![0]) ?? null
      );
    }
  }, [router.query.item]);

  return (
    <Flex gap="10">
      {activeItem ? (
        <VStack
          spacing={10}
          align="start"
          maxWidth="100%"
          width={{ base: "full", md: "unset" }}
        >
          <DashboardContentArea item={activeItem} />
        </VStack>
      ) : (
        <Flex gap="10">
          <VStack spacing={10} align="start" flex="7">
            <VStack width="full" spacing={4} align="start">
              <VStack width="full" align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="semibold">
                  Dashboard
                </Text>
                <Divider height="1px" bgColor="bgSecondary" />
              </VStack>
              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                {cards.map((card) => (
                  <DashboardCard
                    key={card.id}
                    id={card.id}
                    icon={card.icon}
                    desc={card.desc}
                  />
                ))}
              </Grid>
            </VStack>
          </VStack>
          <VStack display={{ base: "none", lg: "initial" }} flex="4">
            <Sidebar
              onAnnouncementOpen={onAnnouncementOpen}
              onJobOpen={onJobOpen}
              onArticleOpen={onArticleOpen}
              onEventOpen={onEventOpen}
              onCafeteriaItemOpen={onCafeteriaItemOpen}
            />
          </VStack>
          <AddAnnouncementModal
            isOpen={isAnnouncementOpen}
            onClose={onAnnouncementClose}
          />
          <AddJobModal mutate={null} isOpen={isJobOpen} onClose={onJobClose} />
          <AddArticleModal isOpen={isArticleOpen} onClose={onArticleClose} />
          <AddEventModal isOpen={isEventOpen} onClose={onEventClose} />
          <AddCafeteriaItemModal
            mutate={null}
            isOpen={isCafeteriaItemOpen}
            onClose={onCafeteriaItemClose}
          />
        </Flex>
      )}
    </Flex>
  );
}
