import {
    Flex,
    VStack,
    Text,
    HStack,
    MenuList,
    MenuItem,
    IconButton,
    Icon,
    Textarea,
    Box,
    Link as ChakraLink,
    Divider,
    useDisclosure,
    Spinner,
    SlideFade,
} from "@chakra-ui/react";
import { Dispatch, ReactElement, RefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import Message from "src/components/Message";
import OptionsMenu from "src/components/Options";
import { PaperClipIcon } from "@heroicons/react/outline";
import { ArrowNarrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/solid";
import { IConversation, IMessage } from "src/types/interfaces";
import NextLink from "next/link";
import Router from "next/router";
import { IconFileUpload } from "src/components/FileUpload";
import AttachmentPreview from "src/components/AttachmentPreview";
import { MAX_ATTACHMENT_SIZE, SUPPORTED_ATTACHMENTS } from "src/utils/constants";
import toast from "react-hot-toast";
import { useUserContext } from "src/contexts/userContext";
import Avatar from "src/components/Avatar";
import { Dialog } from "./Dialog";
import { axiosAuth } from "src/utils/axios";
import { GenericBackendRes, GetConversationsRes, GetMessagesRes } from "src/types/server";
import { AxiosError } from "axios";
import { MessagingState } from "src/reducers/messaging";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import { MessagingAction, MessagingActions } from "src/actions/messaging";
import { Virtuoso } from "react-virtuoso";
import {
    ClientMessageEventData,
    ClientTypingEventData,
    ErrorEventData,
    MarkedMessagesAsReadData,
    MarkMessagesAsReadData,
    ServerMessageEventData
} from "src/../server/sockets/types";
import styles from "src/styles/ConversationArea.module.scss";
import Typing from "src/components/Typing";
import useTyping from "src/hooks/useTyping";
import { KeyedMutator } from "swr";

const nonTypingInputs = [
    "deleteWordBackward",
    "deleteWordForward",
    "deleteSoftLineBackward",
    "deleteSoftLineForward",
    "deleteEntireSoftLine",
    "deleteHardLineBackward",
    "deleteHardLineForward",
    "deleteByDrag",
    "deleteByCut",
    "deleteContent",
    "deleteContentBackward",
    "deleteContentForward",
    "historyUndo",
    "historyRedo",
];

interface MessageComposeProps {
    messageBoxRef: RefObject<HTMLTextAreaElement>;
    sendMessage: () => void;
    endTimeoutId: NodeJS.Timeout | undefined;
    setEndTimeoutId: Dispatch<SetStateAction<NodeJS.Timeout | undefined>>;
    setStartTimeoutId: Dispatch<SetStateAction<NodeJS.Timeout | undefined>>;
    activeConversationId: string;
    recipientId: string;
}

function MessageCompose({ messageBoxRef, sendMessage, ...props }: MessageComposeProps): ReactElement {
    const { socket } = useUserContext();

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            sendMessage();
            return;
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        // @ts-expect-error: inputType exists on the native event
        if (!nonTypingInputs.includes(e.nativeEvent.inputType)) {
            if (!props.endTimeoutId) {
                const payload: ClientTypingEventData = {
                    recipientId: props.recipientId,
                    conversationId: props.activeConversationId,
                };

                props.setEndTimeoutId(
                    setTimeout(() => {
                        clearTimeout(props.endTimeoutId);
                        props.setEndTimeoutId(undefined);
                    }, 3500)
                );

                props.setStartTimeoutId(
                    setTimeout(() => {
                        socket?.emit("typing", payload);
                    }, 500)
                );
            }
        }
    };

    return (
        <Box
            // some weird hack to have the input expand vertically how we want it to
            sx={{
                "&::after": {
                    content: "attr(data-value) \" \"",
                    visibility: "hidden",
                    whiteSpace: "pre-wrap",
                    gridArea: "1/1",
                    wordWrap: "anywhere",
                },
            }}
            transitionProperty="var(--chakra-transition-property-common)"
            transitionDuration="var(--chakra-transition-duration-normal)"
            rounded="10px"
            bgColor="bgSecondary"
            width="full"
            maxHeight="100px"
            border="1px solid"
            borderColor="stroke"
            overflow="auto"
            display="inline-grid"
            alignItems="stretch"
            _hover={{ borderColor: "button.400" }}
            _focusWithin={{
                borderColor: "text",
                boxShadow: "0 0 0 1px var(--chakra-colors-text)",
            }}
        >
            <Textarea
                ref={messageBoxRef}
                placeholder="Send a message..."
                rows={1}
                border="0px"
                resize="none"
                gridArea="1/1"
                focusBorderColor="none"
                _placeholder={{ color: "textMain", opacity: 0.8 }}
                onChange={(e) => (e.target.parentElement!.dataset.value = e.target.value)}
                onInput={handleInput}
                onKeyPress={handleKeyPress}
            />
        </Box>
    );
}

interface LeaveConversationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    mutateConvos: KeyedMutator<GetConversationsRes[]>;
}

function LeaveConversationDialog({ isOpen, onClose, conversationId, mutateConvos }: LeaveConversationDialogProps): ReactElement {
    const handleConfirmation = () => {
        axiosAuth.delete<GenericBackendRes>(`message/leave-conversation/${conversationId}`)
            .then(async (res) => {
                await Router.replace("/messages");
                await mutateConvos();
                toast.success(res.data.message);
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data.message ?? "An error occurred while leaving this conversation");
            });
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            header="Leave Conversation"
            message="Are you sure you want to leave this conversation? You can rejoin later if you change your mind by starting a conversation with the same user."
            btnColor="red"
            confirmationBtnTitle="Leave"
            handleConfirmation={handleConfirmation}
        />
    );
}

interface ConversationHeaderProps {
    convo: IConversation;
    onOpen: () => void;
}

function ConversationHeader({ convo, onOpen }: ConversationHeaderProps): ReactElement {
    const isRecipientTyping = useTyping(convo.id);

    return (
        <Flex width="full" px={3} py={2} boxShadow="conversationHeader">
            <HStack width="full">
                <Flex gap={2} width="full" align="center">
                    <IconButton
                        variant="ghost"
                        display={{ base: "flex", lg: "none" }}
                        aria-label="Back button"
                        icon={<Icon as={ArrowNarrowLeftIcon} w="28px" h="28px" />}
                        onClick={() => Router.back()}
                    />
                    <NextLink href={`/@${convo.recipientUsername}`} passHref>
                        <HStack as={ChakraLink}>
                            <Avatar src={convo.recipientAvatarURL} rounded="lg" width="40px" height="40px" />
                            <VStack width="full" spacing={0} align="start">
                                <Text fontWeight="semibold">{convo.recipientName}</Text>
                                {isRecipientTyping ? (
                                    <Text fontSize="xs" color="textMain">typing...</Text>
                                ) : null}
                            </VStack>
                        </HStack>
                    </NextLink>
                </Flex>
                <OptionsMenu buttonSize="8" direction="vertical">
                    <MenuList>
                        <MenuItem onClick={onOpen}>Leave Conversation</MenuItem>
                    </MenuList>
                </OptionsMenu>
            </HStack>
        </Flex>
    );
}

interface ConversationFooterProps {
    conversationId: string;
    recipientId: string;
}

function ConversationFooter({ conversationId, recipientId }: ConversationFooterProps): ReactElement {
    const { socket } = useUserContext();

    const [previewImage, setPreviewImage] = useState<string>("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [startTimeoutId, setStartTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
    const [endTimeoutId, setEndTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);

    const messageBoxRef = useRef<HTMLTextAreaElement>(null);

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target.files as ArrayLike<File>);

        if (!SUPPORTED_ATTACHMENTS.includes(files[0].type)) {
            toast.error("Unsupported file format");
            return;
        }

        if (files[0].size > MAX_ATTACHMENT_SIZE) {
            toast.error("File size cannot exceed 8MB");
            return;
        }

        setPreviewImage(URL.createObjectURL(files[0]));
        setAttachment(files[0]);
    };

    const removeAttachment = () => {
        setPreviewImage("");
        setAttachment(null);
    };

    const sendMessage = async () => {
        if (messageBoxRef.current?.value.trim().length || attachment) {

            const payload: ClientMessageEventData = {
                message: messageBoxRef.current?.value.trim() ?? "",
                attachment: null,
                conversationId,
                recipientId,
            };

            if (attachment) {
                const data = await attachment.arrayBuffer();
                const _attachment = {
                    data: Buffer.from(data),
                    mimetype: attachment.type,
                };
                payload.attachment = _attachment;
            }

            if (messageBoxRef.current) {
                messageBoxRef.current.parentElement!.dataset.value = "";
                messageBoxRef.current.value = "";
            }

            clearTimeout(startTimeoutId);
            clearTimeout(endTimeoutId);
            setStartTimeoutId(undefined);
            setEndTimeoutId(undefined);

            removeAttachment();

            socket?.emit("message", payload);
        }
    };

    return (
        <VStack width="full" align="start" boxShadow="conversationFooter">
            {previewImage && (
                <>
                    <Box p={4}>
                        <AttachmentPreview image={previewImage} idx={0} removeAttachment={removeAttachment} />
                    </Box>
                    <Divider height="1px" bgColor="bgSecondary" />
                </>
            )}
            <Flex gap={3} width="full" px={2} py={2}>
                <IconFileUpload
                    variant="ghost"
                    aria-label="Add attachment"
                    icon={<Icon as={PaperClipIcon} w="24px" h="24px" />}
                    acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                    onInputChange={(e) => handleAttachmentChange(e)}
                />
                <MessageCompose
                    messageBoxRef={messageBoxRef}
                    sendMessage={sendMessage}
                    activeConversationId={conversationId}
                    recipientId={recipientId}
                    endTimeoutId={endTimeoutId}
                    setEndTimeoutId={setEndTimeoutId}
                    setStartTimeoutId={setStartTimeoutId}
                />
                <IconButton
                    variant="ghost"
                    aria-label="Send message"
                    transform="rotateZ(90deg)"
                    colorScheme="accent"
                    icon={
                        <Icon
                            as={PaperAirplaneIcon}
                            color="accent"
                            w="24px"
                            h="24px"
                        />
                    }
                    onClick={sendMessage}
                />
            </Flex>
        </VStack>
    );
}

interface ConversationBodyProps {
    convo: IConversation;
    state: MessagingState;
    dispatch: Dispatch<MessagingAction>;
}

const START_INDEX = Number.MAX_SAFE_INTEGER - 10000;

function ConversationBody({ convo, state, dispatch }: ConversationBodyProps): ReactElement {
    const { user } = useUserContext();

    const [reachedStart, setReachedStart] = useState(false);
    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);

    const isRecipientTyping = useTyping(convo.id);

    const getKey = (pageIndex: number) => {
        return `message/get-messages/${convo.id}/${pageIndex}`;
    };

    const { data, error, isValidating, size: page, setSize: setPage } = useSWRInfinite<GetMessagesRes, AxiosError<GenericBackendRes>>(getKey, fetcher, {
        initialSize: 1,
        revalidateOnFocus: false,
    });

    const loadMoreMessages = async () => {
        if (reachedStart) {
            return;
        }

        await setPage(page + 1);
    };

    useEffect(() => {
        if (data) {
            if (data[data.length - 1].messages.length < 50) {
                setReachedStart(true);
            }

            const messages = data.reduce((prev, curr) => curr.messages.concat(prev), [] as IMessage[]);

            setFirstItemIndex(START_INDEX - messages.length);

            dispatch({
                type: MessagingActions.FETCH_MESSAGES,
                payload: {
                    messages,
                }
            });
        }

        if (error) {
            toast.error(error.response?.data.message ?? "An error occurred while fetching messages");
        }
    }, [data, error, dispatch]);

    const Header = () => {
        return (
            <VStack width="full">
                {reachedStart ? (
                    <Text color="textMain" textAlign="center" py={4} fontWeight="semibold">
                        You reached the beginning of this conversation
                    </Text>
                ) : (
                    <Spinner />
                )}
            </VStack>
        );
    };

    return (
        <Flex
            flexGrow={1}
            overflowY="scroll"
            gap={5}
            direction="column"
            width="full"
            py={2}
        >
            {isValidating && state.messages.length === 0 ? (
                <VStack width="full">
                    <Spinner />
                </VStack>
            ) : (
                <Virtuoso
                    key={state.activeConversation?.id}
                    className={styles.messagesList}
                    totalCount={state.messages.length + 1}
                    alignToBottom
                    followOutput
                    overscan={400}
                    startReached={loadMoreMessages}
                    initialTopMostItemIndex={
                        state.messages.length > 0
                            ? state.messages.length - 1
                            : 0
                    }
                    atBottomThreshold={35}
                    firstItemIndex={firstItemIndex}
                    components={{
                        Header,
                    }}
                    itemContent={(i) => {
                        const message = state.messages[Math.abs(firstItemIndex - i)];

                        if (Math.abs(firstItemIndex - i) === state.messages.length && isRecipientTyping) return (
                            <SlideFade in={isRecipientTyping} unmountOnExit offsetY="20px">
                                <Typing recipientAvatarURL={convo.recipientAvatarURL} />
                            </SlideFade>
                        ); else if (Math.abs(firstItemIndex - i) === state.messages.length && !isRecipientTyping) return (
                            <Box width="1px" height="1px" />
                        );
                        if (!message) return;
                        return (
                            <Message
                                key={message.id}
                                content={message.content}
                                userOwned={user?.id === message.userId}
                                attachmentURL={message.attachmentURL}
                                createdAt={message.createdAt}
                                wasRead={message.wasRead}
                                recipientAvatarURL={convo.recipientAvatarURL}
                            />
                        );
                    }}
                />
            )}
        </Flex>
    );
}

interface ConversationAreaProps {
    conversation: IConversation;
    state: MessagingState;
    dispatch: Dispatch<MessagingAction>;
    mutateConvos: KeyedMutator<GetConversationsRes[]>;
}

export default function ConversationArea({
    conversation: convo,
    state,
    dispatch,
    mutateConvos,
}: ConversationAreaProps): ReactElement {
    const { socket, user } = useUserContext();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleMessage = useCallback((message: ServerMessageEventData) => {
        if (message.conversationId === convo.id) {
            if (user?.settings?.readReceipts) {
                const payload: MarkMessagesAsReadData = {
                    conversationId: convo.id,
                    userId: user?.id,
                    recipientId: convo.recipientId,
                };
                
                socket?.emit("markMessagesAsRead", payload);
            }

            dispatch({
                type: MessagingActions.RECEIVE_MESSAGE,
                payload: {
                    message: {
                        ...message
                    },
                }
            });
        }
    }, [convo.id, dispatch, socket, user?.settings?.readReceipts]);

    const handleMarkedMessagesAsRead = useCallback((payload: MarkedMessagesAsReadData) => {
        if (payload.conversationId === convo.id) {
            dispatch({
                type: MessagingActions.MARK_MESSAGES_AS_READ,
            });
        }
    }, [convo.id, dispatch]);

    const handleError = (data: ErrorEventData) => {
        toast.error(data.message);
    };

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessage);
            socket.on("markedMessagesAsRead", handleMarkedMessagesAsRead);
            socket.on("error", handleError);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessage);
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
                socket.off("error", handleError);
            }
        };
    }, [socket, handleMessage, handleMarkedMessagesAsRead]);

    return (
        <VStack
            spacing={0}
            height={{ base: "100vh", lg: "calc(100vh - var(--chakra-headerHeight-desktop) - 2.5rem)" }}
            bgColor="bgPrimary"
            rounded="4px"
            width="full"
            position={{ base: "fixed", lg: "relative" }}
            top={0}
            right={0}
            zIndex={3}
        >
            <ConversationHeader convo={convo} onOpen={onOpen} />
            <ConversationBody key={`${convo.id}-body`} convo={convo} state={state} dispatch={dispatch} />
            <ConversationFooter key={`${convo.id}-footer`} conversationId={convo.id} recipientId={convo.recipientId} />
            <LeaveConversationDialog
                isOpen={isOpen}
                onClose={onClose}
                conversationId={convo.id}
                mutateConvos={mutateConvos}
            />
        </VStack>
    );
}
