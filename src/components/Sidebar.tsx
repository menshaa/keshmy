import { ReactElement, useEffect, useState } from "react";
import {
    Button,
    Text,
    VStack,
    Link as ChakraLink,
    Box,
    Spinner,
    Grid,
} from "@chakra-ui/react";
import Event from "src/components/Event";
import NextLink from "next/link";
import styles from "src/styles/sidebar.module.scss";
import useSWR, { KeyedMutator } from "swr";
import { fetcher } from "src/utils/helpers";
import { GenericBackendRes, GetCafeteriaItemsRes, GetEventsRes } from "src/types/server";
import { AxiosError } from "axios";
import { ICafeteriaItem, IEvent } from "src/types/interfaces";

interface SidebarProps {
    withEvents?: boolean;
    withCafeteria?: boolean;
}

interface NewCafeteriaItemProps {
    name: string;
    price: string;
    image: string;
}

interface SidebarData {
    isValidating: boolean;
    error: AxiosError<GenericBackendRes> | undefined;
}

function NewCafeteriaItem({ name, price, image }: NewCafeteriaItemProps): ReactElement {
    return (
        <Box boxSize="full" height="200px" overflow="hidden" position="relative">
            <Box p={5}>
                <Text
                    color="white"
                    position="relative"
                    fontSize="20px"
                    fontWeight="semibold"
                    zIndex={1}
                >
                    {name}
                </Text>
            </Box>
            <Text
                color="white"
                position="absolute"
                fontSize="25px"
                fontWeight="bold"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={1}
            >
                {price}TL
            </Text>
            <Box
                boxSize="full"
                bgImage={image}
                bgRepeat="no-repeat"
                bgPosition="center"
                bgSize="cover"
                filter="blur(2px)"
                position="absolute"
                rounded="md"
                top="0"
            />
            <Box
                position="absolute"
                top="0"
                width="full"
                rounded="md"
                boxSize="full"
                bgColor="rgba(0, 0, 0, 0.55)"
            />
        </Box>
    );
}

interface ErrorProps {
    error: AxiosError<GenericBackendRes>;
}

function Error({ error }: ErrorProps): ReactElement {
    return (
        <Text fontSize="lg" fontWeight="bold">{error.response?.data.message ?? "An error has occurred"}</Text>
    );
}

interface EventsProps extends SidebarData {
    events: IEvent[];
    mutate: KeyedMutator<GetEventsRes>;
}

function Events({ isValidating, error, events, mutate }: EventsProps): ReactElement {
    if (error) return <Error error={error} />;

    if (isValidating && !events.length) {
        return (
            <VStack width="full">
                <Spinner />
            </VStack>
        );
    }

    return (
        <>
            {events.map((event) => (
                <Event
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    description={event.description ?? ""}
                    location={event.location}
                    imageURL={event.imageURL ?? ""}
                    interest={event.interest}
                    date={event.time}
                    isInterested={event.isInterested ?? false}
                    mutateEvents={mutate}
                />
            ))}
        </>
    );
}

function UpcomingEvents(): ReactElement {
    const [events, setEvents] = useState<IEvent[]>([]);

    const { data, error, isValidating, mutate } = useSWR<GetEventsRes, AxiosError<GenericBackendRes>>("events/get-sidebar-events", fetcher, {
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (data) {
            setEvents(data.events);
        }
    }, [data]);

    if (!isValidating && !events.length) return <></>;

    return (
        <VStack width="full" align="start">
            <Text fontWeight="semibold">Upcoming Events</Text>
            <VStack width="full" spacing={4} align="start">
                <Events isValidating={isValidating} error={error} events={events} mutate={mutate} />
                <NextLink href="/events" passHref>
                    <Button
                        as={ChakraLink}
                        colorScheme="button"
                        variant="outline"
                        size="lg"
                    >
                        See All
                    </Button>
                </NextLink>
            </VStack>
        </VStack>
    );
}

interface CafeteriaItemsProps extends SidebarData {
    items: ICafeteriaItem[];
}

function CafeteriaItems({ isValidating, items, error }: CafeteriaItemsProps): ReactElement {
    if (error) return <Error error={error} />;

    if (isValidating && !items.length) {
        return (
            <VStack width="full">
                <Spinner />
            </VStack>
        );
    }

    return (
        <Grid
            width="full"
            gap={4}
            templateColumns="repeat(2, 1fr)"
        >
            {items.map((item) => (
                <NewCafeteriaItem
                    key={item.id}
                    name={item.name}
                    price={item.price}
                    image={item.imageURL ?? "/fallback-cafeteria-item.jpg"}
                />
            ))}
        </Grid>
    );
}

function NewCafeteriaItems(): ReactElement {
    const [items, setItems] = useState<ICafeteriaItem[]>([]);
    const { data, error, isValidating } = useSWR<GetCafeteriaItemsRes, AxiosError<GenericBackendRes>>("cafeteria/get-sidebar-items", fetcher, {
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (data) {
            setItems(data.items);
        }

    }, [data]);

    if (!isValidating && !items.length) return <></>;

    return (
        <VStack width="full" align="start">
            <Text fontWeight="semibold">New Cafeteria Items!</Text>
            <VStack width="full" spacing={4} align="start">
                <CafeteriaItems isValidating={isValidating} error={error} items={items} />
                <NextLink href="/cafeteria" passHref>
                    <Button
                        as={ChakraLink}
                        colorScheme="button"
                        variant="outline"
                        size="lg"
                    >
                        See All
                    </Button>
                </NextLink>
            </VStack>
        </VStack>
    );
}

export default function Sidebar(props: SidebarProps): ReactElement {
    return (
        <Box className={styles.sidebar}>
            <VStack width="full" spacing={8}>
                {props.withEvents && (
                    <UpcomingEvents />
                )}
                {props.withCafeteria && (
                    <NewCafeteriaItems />
                )}
            </VStack>
        </Box>
    );
}

Sidebar.defaultProps = {
    withEvents: true,
    withCafeteria: true,
};
