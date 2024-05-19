import { Box, Flex, VStack, Text, Image, Badge, useDisclosure, Button, Divider, Spinner } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import { useUserContext } from "src/contexts/userContext";
import AddCafeteriaItemModal from "src/components/AddCafeteriaItemModal";
import { GenericBackendRes, GetCafeteriaItemsRes } from "src/types/server";
import toast from "react-hot-toast";
import { ICafeteriaItem } from "src/types/interfaces";
import { AxiosError } from "axios";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { VirtuosoGrid } from "react-virtuoso";
import styles from "src/styles/CafeteriaMenu.module.scss";

interface CafeteriaItemProps {
    name: string;
    price: string;
    imageURL?: string;
    createdAt: string;
}

function CafeteriaItem({ name, price, imageURL, createdAt }: CafeteriaItemProps): ReactElement {
    const isNew = Date.now() - (new Date(createdAt)).getTime() <= 3600 * 24 * 30 * 1000;

    return (
        <VStack
            position="relative"
            spacing={0}
            align="start"
            bgColor="bgPrimary"
            overflow="hidden"
            rounded="4px"
        >
            <Image
                fit="cover"
                width="full"
                height="200px"
                src={imageURL ?? "/fallback-cafeteria-item.jpg"}
                alt={`Image for ${name}`}
            />
            <Box
                position="absolute"
                width="full"
                height="200px"
                bgColor="rgba(0, 0, 0, 0.55)"
            />
            {isNew ? (
                <Badge
                    position="absolute"
                    top={3}
                    right={4}
                    variant="subtle"
                    colorScheme="green"
                >
                    New
                </Badge>
            ) : null}
            <VStack px={4} py={2} align="start">
                <Text fontWeight="bold" fontSize="18px">{name}</Text>
                <Text>{price}TL</Text>
            </VStack>
        </VStack>
    );
}

interface CafeteriaMenuProps {
    swr: SWRInfiniteResponse<GetCafeteriaItemsRes, AxiosError<GenericBackendRes>>;
}

function CafeteriaMenu({ swr }: CafeteriaMenuProps): ReactElement {
    const [reachedEnd, setReachedEnd] = useState(false);
    const [items, setItems] = useState<ICafeteriaItem[]>([]);

    const { data, error, isValidating, size: page, setSize: setPage } = swr;

    const loadMoreItems = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd) return (
            <VStack width="full">
                <Spinner />
            </VStack>
        );

        return null;
    };

    useEffect(() => {
        if (data) {
            setItems(data.reduce((prev, curr) => curr.items.concat(prev), [] as ICafeteriaItem[]));

            if (data[data.length - 1].items.length < 30) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error.response?.data.message ?? "An error occurred while fetching menu");
        }
    }, [data, error]);

    if (!isValidating && data?.[0]?.items.length === 0) return (
        <VStack width="full" textAlign="center">
            <Image
                fit="cover"
                width="250px"
                src="/graphics/List_Is_Empty.png"
                alt="List is empty graphic"
            />
            <Text fontSize="3xl" fontWeight="bold">The cafeteria menu seems to be empty</Text>
        </VStack>
    );

    return (
        <VirtuosoGrid
            className={styles.menu}
            data={items}
            totalCount={items.length}
            endReached={loadMoreItems}
            useWindowScroll
            components={{
                Footer,
            }}
            itemContent={(_, item) => (
                <CafeteriaItem
                    key={item.id}
                    name={item.name}
                    price={item.price}
                    imageURL={item.imageURL}
                    createdAt={item.createdAt}
                />
            )}
        />
    );
}

const getKey = (pageIndex: number) => {
    return `cafeteria/get-items/${pageIndex}`;
};

export default function Cafeteria(): ReactElement {
    const { user } = useUserContext();

    const swr = useSWRInfinite<GetCafeteriaItemsRes, AxiosError<GenericBackendRes>>(getKey, fetcher, {
        revalidateOnFocus: false,
    });

    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex gap="10">
            <VStack spacing={4} align="start" flex="7">
                {user?.isAdmin ? (
                    <VStack width="full" align="start" spacing={5}>
                        <VStack width="full" align="start" spacing={5}>
                            <Text fontSize="18px" fontWeight="semibold">New cafeteria items are available? Add them below</Text>
                            <Button colorScheme="button" size="sm" px={8} onClick={onOpen}>Add Item</Button>
                        </VStack>
                        <Divider height="1px" bgColor="bgSecondary" />
                        <AddCafeteriaItemModal mutate={swr.mutate} isOpen={isOpen} onClose={onClose} />
                    </VStack>
                ) : null}
                <Text fontSize="xl" fontWeight="semibold">
                    Cafeteria Menu
                </Text>
                <CafeteriaMenu swr={swr} />
            </VStack>
        </Flex>
    );
}
