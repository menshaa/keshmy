import {
  Flex,
  VStack,
  Text,
  Image,
  Button,
  Divider,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Announcement from "src/components/Announcement";
import { useUserContext } from "src/contexts/userContext";
import AddAnnouncementModal from "src/components/AddAnnouncementModal";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { IAnnouncement } from "src/types/interfaces";
import { GenericBackendRes, GetAnnouncementsRes } from "src/types/server";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/Articles.module.scss";

const getKey = (pageIndex: number) => {
  return `announcements/get-announcements?page=${pageIndex}`;
};

function AnnouncementsBody(): ReactElement {
  const {
    data,
    error,
    isValidating,
    mutate,
    size: page,
    setSize: setPage,
  } = useSWRInfinite(getKey, fetcher<GetAnnouncementsRes>, {
    revalidateOnFocus: false,
  });

  const [reachedEnd, setReachedEnd] = useState(false);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);

  const loadMoreAnnouncements = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
  };

  const deleteAnnouncementCB = async () => {
    await mutate();
  };

  const Footer = (): ReactElement | null => {
    if (!reachedEnd)
      return (
        <VStack width="full">
          <Spinner />
        </VStack>
      );

    return null;
  };

  useEffect(() => {
    if (data) {
      setAnnouncements(
        data.reduce(
          (prev, curr) => curr.announcements.concat(prev),
          [] as IAnnouncement[]
        )
      );

      if (data[data.length - 1].announcements.length < 25) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        (error as AxiosError<GenericBackendRes>).response?.data.message ??
          "An error occurred while fetching announcements"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.announcements.length === 0)
    return (
      <VStack width="full" spacing={4} textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/Deleted.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          No announcements are available at this time
        </Text>
      </VStack>
    );

  return (
    <Virtuoso
      className={styles.articles}
      data={announcements}
      totalCount={announcements.length}
      endReached={loadMoreAnnouncements}
      useWindowScroll
      components={{
        Footer,
      }}
      itemContent={(_, announcement) => (
        <Announcement
          key={announcement.id}
          id={announcement.id}
          title={announcement.title}
          description={announcement.content ?? ""}
          date={announcement.publishDate ?? ""}
          deleteAnnouncementCB={deleteAnnouncementCB}
          mutate={mutate}
        />
      )}
    />
  );
}

export default function Announcements(): ReactElement {
  const { user } = useUserContext();

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex gap="10">
      <VStack align="start" flex="7">
        {user?.isAdmin || user?.isAcademicStaff ? (
          <VStack width="full" align="start" spacing={5}>
            <VStack width="full" align="start" spacing={5}>
              <Text fontSize="18px" fontWeight="semibold">
                Looking to publish a new announcement? Click the button below
              </Text>
              <Button colorScheme="button" size="sm" px={8} onClick={onOpen}>
                Publish Announcement
              </Button>
            </VStack>
            <Divider height="1px" bgColor="bgSecondary" />
            <AddAnnouncementModal isOpen={isOpen} onClose={onClose} />
          </VStack>
        ) : null}
        <Text fontSize="xl" fontWeight="semibold">
          Announcements
        </Text>
        <AnnouncementsBody />
      </VStack>
    </Flex>
  );
}
