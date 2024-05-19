import { Box, Flex, Text, Spacer, HStack, VStack, Button } from "@chakra-ui/react";
import { AxiosError } from "axios";
import Router from "next/router";

import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";

interface GrouptProps {
    id: string;
    name: string;
    description: string;
    displayJoinButton: boolean;
    isJoinedInitial: boolean;
}

export default function Group({
    id,
    name,
    description,
    displayJoinButton,
    isJoinedInitial,
}: GrouptProps): ReactElement {
    const [isJoined, setIsJoined] = useState(isJoinedInitial);

    const onJoinGroup = (id: string) => {
        axiosAuth
            .post<GenericBackendRes>(`groups/${id}/join-group`)
            .then((res) => {
                toast.success(res.data.message);
                setIsJoined(true);
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(
                    e.response?.data?.message ??
                        "An error occurred while submitting the event",
                );
            });
    };
    return (
        <Flex
            position="relative"
            rounded="4px"
            overflow="hidden"
            direction="column"
            gap={6}
            p={5}
            pb={4}
            align="start"
            width="full"
            color="gray.100"
        >
            <Box
                position="absolute"
                zIndex={-1}
                top={0}
                right={0}
                width="full"
                height="full"
                bgColor="rgba(0, 0, 0, 0.45)"
            />
            <HStack
                width="full"
                justify="space-between"
                align="flex-end"
                onClick={() => Router.push(`/view-group/${id}`)}
            >
                <VStack align="start">
                    <Text fontWeight="semibold" noOfLines={1} fontSize="18px">
                        {name}
                    </Text>
                    <Text fontWeight="" fontSize="14px">
                        {description}
                    </Text>
                </VStack>
                {displayJoinButton ? (
                    <Button
                        size="sm"
                        colorScheme="button"
                        disabled={isJoined}
                        color={"black"}
                        backgroundColor={isJoined ? "grey" : "white"}
                        onClick={() => onJoinGroup(id)}
                    >
                        {isJoined ? "Joined" : "Join"}
                    </Button>
                ) : null}
            </HStack>
            <Spacer />
        </Flex>
    );
}
