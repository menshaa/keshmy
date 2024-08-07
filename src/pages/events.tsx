import {
  Text,
  Flex,
  Image,
  VStack,
  useDisclosure,
  Divider,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Event from "src/components/Event";
import { useUserContext } from "src/contexts/userContext";
import AddEventModal from "src/components/AddEventModal";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import { IEvent } from "src/types/interfaces";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { GenericBackendRes, GetEventsRes } from "src/types/server";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/Articles.module.scss";

const getKey = (pageIndex: number) => {
  return `events/get-events?page=${pageIndex}`;
};

function EventsBody(): ReactElement {
  const {
    data,
    error,
    isValidating,
    mutate,
    size: page,
    setSize: setPage,
  } = useSWRInfinite(getKey, fetcher<GetEventsRes>, {
    revalidateOnFocus: false,
  });

  const [reachedEnd, setReachedEnd] = useState(false);
  const [events, setEvents] = useState<IEvent[]>([]);

  const loadMoreEvents = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
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
      setEvents(
        data.reduce((prev, curr) => curr.events.concat(prev), [] as IEvent[])
      );

      if (data[data.length - 1].events.length < 25) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        (error as AxiosError<GenericBackendRes>).response?.data.message ??
          "An error occurred while fetching events"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.events.length === 0)
    return (
      <VStack width="full" spacing={4} textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/Deleted.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          No events have been scheduled
        </Text>
      </VStack>
    );

  return (
    <Virtuoso
      className={styles.articles}
      data={events}
      totalCount={events.length}
      endReached={loadMoreEvents}
      useWindowScroll
      components={{
        Footer,
      }}
      itemContent={(_, event) => (
        <Event
          key={event.id}
          id={event.id}
          title={event.title}
          description={event.description ?? ""}
          location={event.location}
          imageURL={event.imageURL ?? ""}
          date={event.time}
          isInterested={event.isInterested ?? false}
          interest={event.interest}
          mutateEvents={mutate}
        />
      )}
    />
  );
}

export default function Events(): ReactElement {
  const { user } = useUserContext();

  const addEventModal = useDisclosure();

  return (
    <Flex gap="10">
      <VStack spacing={4} align="start" flex="7">
        {user?.isAdmin || user?.isAcademicStaff ? (
          <>
            <VStack width="full" align="start" spacing={5}>
              <Text fontSize="18px" fontWeight="semibold">
                Looking to add an upcoming event? Click the button below
              </Text>
              <Button
                colorScheme="button"
                size="sm"
                px={8}
                onClick={addEventModal.onOpen}
              >
                Add Event
              </Button>
            </VStack>
            <Divider height="1px" bgColor="bgSecondary" />
            <AddEventModal
              isOpen={addEventModal.isOpen}
              onClose={addEventModal.onClose}
            />
          </>
        ) : null}
        <Text fontSize="xl" fontWeight="semibold">
          Events
        </Text>
        <EventsBody />
      </VStack>
    </Flex>
  );
}
