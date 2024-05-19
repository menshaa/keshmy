import {
    Text,
    Flex,
    Image,
    VStack,
    useDisclosure,
    Divider,
    Button,
    Spinner,
    HStack,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Group from "src/components/Group";
import AddGroupModal from "src/components/AddGroupModal";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import { IGroup } from "src/types/interfaces";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { GenericBackendRes, GetMyGroupsRes } from "src/types/server";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/Articles.module.scss";
import Router from "next/router";

const getMyGroups = () => {
    return "groups/my-groups";
};

function MyGroupsBody(): ReactElement {
    const {
        data,
        error,
        isValidating,
        mutate,
        size: page,
        setSize: setPage,
    } = useSWRInfinite(getMyGroups, fetcher<GetMyGroupsRes>, {
        revalidateOnFocus: false,
    });

    const [reachedEnd, setReachedEnd] = useState(false);
    const [groups, setGroups] = useState<IGroup[]>([]);

    const loadMoreGroups = async () => {
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
            setGroups(
                data.reduce((prev, curr) => curr.groups.concat(prev), [] as IGroup[]),
            );

            if (data[data.length - 1].groups.length < 25) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(
                (error as AxiosError<GenericBackendRes>).response?.data.message ??
                    "An error occurred while fetching groups",
            );
        }
    }, [data, error]);

    if (!isValidating && data?.[0]?.groups.length === 0)
        return (
            <VStack width="full" spacing={4} textAlign="center">
                <Image
                    fit="cover"
                    width="250px"
                    src="/graphics/Deleted.png"
                    alt="List is empty graphic"
                />
                <Text fontSize="3xl" fontWeight="bold">
                    You are not in any group at the moment. Create your own, or join
                    existing groups
                </Text>
            </VStack>
        );

    return (
        <Virtuoso
            className={styles.articles}
            data={groups}
            totalCount={groups.length}
            endReached={loadMoreGroups}
            useWindowScroll
            components={{
                Footer,
            }}
            itemContent={(_, group) => (
                <Group
                    key={group.id}
                    id={group.id}
                    name={group.name}
                    description={group.description ?? ""}
                    displayJoinButton={false}
                    isJoinedInitial={true}
                />
            )}
        />
    );
}

export default function Groups(): ReactElement {
    const addGroupModal = useDisclosure();
    const { mutate } = useSWRInfinite(getMyGroups, fetcher<GetMyGroupsRes>, {
        revalidateOnFocus: false,
    });

    return (
        <Flex gap="5">
            <VStack spacing={4} align="start" flex="5">
                <>
                    <VStack width="" align="start" spacing={5}>
                        <Text fontSize="18px" fontWeight="semibold">
                            Join groups or create your own!
                        </Text>
                        <HStack>
                            <Button
                                colorScheme="button"
                                size="sm"
                                px={8}
                                onClick={() => Router.push("/available-groups")}
                            >
                                Join Groups
                            </Button>
                            <Button
                                colorScheme="button"
                                size="sm"
                                px={8}
                                onClick={addGroupModal.onOpen}
                            >
                                Create Group
                            </Button>
                        </HStack>
                    </VStack>
                    <Divider height="1px" bgColor="bgSecondary" />
                    <AddGroupModal
                        isOpen={addGroupModal.isOpen}
                        onClose={addGroupModal.onClose}
                        mutate={mutate}
                    />
                </>
                <Text fontSize="xl" fontWeight="semibold">
                    My Groups
                </Text>
                <MyGroupsBody />
            </VStack>
        </Flex>
    );
}
