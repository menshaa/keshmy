import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { MouseEventHandler, ReactElement } from "react";
import RelativeTime from "src/components/RelativeTime";
import Avatar from "src/components/Avatar";

interface ConversationProps {
    recipientName: string;
    recipientUsername: string;
    recipientAvatarURL: string;
    updatedAt: string;
    lastMessage: string;
    isActive: boolean;
    onClick: MouseEventHandler<HTMLElement>;
}

export default function Conversation(props: ConversationProps): ReactElement {
    return (
        <Flex
            as={Button}
            borderBottom={{
                base: "2px solid var(--chakra-colors-bgSecondary)",
                md: "initial",
            }}
            _last={{
                borderBottom: "none"
            }}
            width="full"
            height="full"
            align="start"
            position="relative"
            bgColor={props.isActive ? "conversationItem" : "conversationItem"}
            colorScheme={"conversationItem"}
            textAlign="left"
            rounded={{ base: 0, md: "4px" }}
            py={3}
            px={4}
            onClick={props.onClick}
        >
            <Box
                display={props.isActive ? "initial" : "none"}
                position="absolute"
                top={0}
                left={0}
                height="full"
                width="6px"
                bgColor="accent.500"
                rounded="4px 0 0 4px"
            />
            <Flex gap={3} width="full" direction="column">
                <HStack>
                    <Avatar src={props.recipientAvatarURL} rounded="lg" width="40px" height="40px" />
                    <Text
                        color="text"
                        fontWeight={props.isActive ? "bold" : "semibold"}
                        noOfLines={1}
                    >
                        {props.recipientName}
                    </Text>
                </HStack>
                <Text color={"textMain"} wordBreak="break-all" whiteSpace="normal" fontWeight="400" fontSize="xs" noOfLines={1}>
                    {props.lastMessage}
                </Text>
            </Flex>
            <Text
                top={3}
                right={3}
                color={"textSecondary"}
                fontWeight="semibold"
                fontSize="xs"
            >
                <RelativeTime date={props.updatedAt} type="conversation" />
            </Text>
        </Flex>
    );
}
