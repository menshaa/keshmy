import {
    Box,
    HStack,
    VStack,
    Text,
    MenuList,
    MenuItem,
    Tooltip,
    LinkBox,
    LinkOverlay,
    useDisclosure,
    Icon,
} from "@chakra-ui/react";
import { ReactElement } from "react";
import OptionsMenu from "src/components/Options";
import NextLink from "next/link";
import CreationDate from "src/components/dashboard/creationDate";
import { useUserContext } from "src/contexts/userContext";
import { TrashIcon } from "@heroicons/react/solid";
import { axiosAuth } from "src/utils/axios";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { GenericBackendRes } from "src/types/server";
import { Dialog } from "src/components/Dialog";

interface DeleteDialogProps {
    articleId: string;
    isOpen: boolean;
    onClose: () => void;
    deleteArticleCB: (() => Promise<void>) | null;
}

function DeleteDialog({ articleId, isOpen, onClose, deleteArticleCB }: DeleteDialogProps): ReactElement {
    const handleDelete = () => {
        axiosAuth.delete<GenericBackendRes>(`articles/delete-article/${articleId}`)
            .then(async (res) => {
                toast.success(res.data.message);
                await deleteArticleCB?.();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data.message ?? "An error occurred while deleting this article");
            });
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            header="Delete Article"
            message="Are you sure you want to delete this article? This action cannot be undone."
            btnColor="red"
            confirmationBtnTitle="Delete"
            handleConfirmation={handleDelete}
        />
    );
}

interface ArticleProps {
    id: string;
    title: string;
    authorName: string;
    authorUsername: string;
    content: string;
    publishDate: string;
    deleteArticleCB: (() => Promise<void>) | null;
}

export default function Article({
    id,
    title,
    authorName,
    authorUsername,
    content,
    publishDate,
    deleteArticleCB,
}: ArticleProps): ReactElement {
    const { user } = useUserContext();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <LinkBox width="full">
                <Box width="full" px={5} py={4} rounded="4px" bgColor="bgPrimary">
                    <VStack spacing={4} align="start">
                        <HStack width="full" my={2} align="start" justify="space-between">
                            <VStack spacing={0} align="start">
                                <Tooltip hasArrow label={title} openDelay={400}>
                                    <NextLink href={`/articles/${id}`} passHref>
                                        <LinkOverlay>
                                            <Text
                                                color="text"
                                                noOfLines={1}
                                                fontWeight="semibold"
                                                fontSize="lg"
                                            >
                                                {title}
                                            </Text>
                                        </LinkOverlay>
                                    </NextLink>
                                </Tooltip>
                                <Text color="textSecondary" noOfLines={1} fontSize="sm">
                                    By{" "}
                                    <Text as="span" fontWeight="bold">
                                        {authorName}
                                    </Text>
                                </Text>
                            </VStack>
                            {user?.isAdmin || user?.username === authorUsername ? (
                                <OptionsMenu>
                                    <MenuList>
                                        <MenuItem color="red.500" onClick={onOpen}>
                                            <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                                            <span>Delete Article</span>
                                        </MenuItem>
                                    </MenuList>
                                </OptionsMenu>
                            ) : null}
                        </HStack>
                        <Text noOfLines={2} wordBreak="break-word" color="textMain" fontSize="xs">
                            {content}
                        </Text>
                        <Text color="textSecondary" fontSize="xs">
                            Published on <CreationDate date={publishDate} />
                        </Text>
                    </VStack>
                </Box>
            </LinkBox>
            <DeleteDialog articleId={id} isOpen={isOpen} onClose={onClose} deleteArticleCB={deleteArticleCB} />
        </>
    );
}
