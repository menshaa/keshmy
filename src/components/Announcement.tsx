import {
    Box,
    HStack,
    VStack,
    Text,
    Icon,
    MenuList,
    MenuItem,
    Tooltip,
    LinkBox,
    LinkOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import { ReactElement } from "react";
import { formatAnnouncementDate } from "src/utils/helpers";
import OptionsMenu from "src/components/Options";
import NextLink from "next/link";
import { TrashIcon } from "@heroicons/react/solid";
import toast from "react-hot-toast";
import { GenericBackendRes } from "src/types/server";
import { AxiosError } from "axios";
import { axiosAuth } from "src/utils/axios";
import { Dialog } from "src/components/Dialog";
import { useUserContext } from "src/contexts/userContext";

interface AnnouncementProps {
    id: string;
    title: string;
    description: string;
    date: string;
    deleteAnnouncementCB: () => Promise<void>;
}

interface DeleteDialogProps {
    announcementId: string;
    isOpen: boolean;
    onClose: () => void;
    deleteAnnouncementCB: () => Promise<void>;
}

function DeleteDialog({ announcementId, isOpen, onClose, deleteAnnouncementCB }: DeleteDialogProps): ReactElement {
    const handleDelete = () => {
        axiosAuth.delete<GenericBackendRes>(`announcements/delete-announcement/${announcementId}`)
            .then(async (res) => {
                toast.success(res.data.message);
                await deleteAnnouncementCB();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data.message ?? "An error occurred while deleting this announcement");
            });
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            header="Delete Announcement"
            message="Are you sure you want to delete this announcement? This action cannot be undone."
            btnColor="red"
            confirmationBtnTitle="Delete"
            handleConfirmation={handleDelete}
        />
    );
}

export default function Announcement({
    id,
    title,
    description,
    date,
    deleteAnnouncementCB,
}: AnnouncementProps): ReactElement {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user } = useUserContext();

    return (
        <>
            <LinkBox width="full">
                <Box width="full" px={5} py={4} rounded="4px" bgColor="bgPrimary">
                    <VStack spacing={4} align="start">
                        <HStack width="full" my={2} justify="space-between">
                            <Tooltip hasArrow label={title} openDelay={400}>
                                <NextLink href={`/announcements/${id}`} passHref>
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
                            {user?.isAdmin ? (
                                <OptionsMenu>
                                    <MenuList>
                                        <MenuItem color="red.500" onClick={onOpen}>
                                            <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                                            <span>Delete Announcement</span>
                                        </MenuItem>
                                    </MenuList>
                                </OptionsMenu>
                            ) : null}
                        </HStack>
                        <Text noOfLines={2} wordBreak="break-word" color="textMain" fontSize="xs">
                            {description}
                        </Text>
                        <Text color="textSecondary" fontSize="xs">
                            {formatAnnouncementDate(date)}
                        </Text>
                    </VStack>
                </Box>
            </LinkBox>
            <DeleteDialog announcementId={id} isOpen={isOpen} onClose={onClose} deleteAnnouncementCB={deleteAnnouncementCB} />
        </>
    );
}
