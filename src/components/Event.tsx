import {
  Box,
  Flex,
  Text,
  Spacer,
  HStack,
  VStack,
  Icon,
  Button,
  Badge,
  useDisclosure,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { Clock, MapPinLine } from "phosphor-react";
import { ReactElement } from "react";
import {
  GenericBackendRes,
  GetEventsRes,
  SearchAllRes,
} from "src/types/server";
import { formatEventDate } from "src/utils/helpers";
import { KeyedMutator } from "swr";
import EventModal from "src/components/EventModal";
import OptionsMenu from "./Options";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";
import { useUserContext } from "src/contexts/userContext";
import EditEventModal from "./EditEventModal";
import { Dialog } from "./Dialog";
import { AxiosError } from "axios";
import { axiosAuth } from "src/utils/axios";
import toast from "react-hot-toast";

interface EventProps {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageURL: string;
  isInterested: boolean;
  interest: number;
  mutateEvents:
    | KeyedMutator<GetEventsRes[]>
    | KeyedMutator<GetEventsRes>
    | KeyedMutator<SearchAllRes>;
}

function ClockIcon(): ReactElement {
  return <Clock weight="bold" size="18" />;
}

function LocationIcon(): ReactElement {
  return <MapPinLine weight="bold" size="18" />;
}

export type EventType = Omit<EventProps, "onModalOpen" | "setModalEvent">;

interface DeleteDialogProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  mutate?: any;
}

function DeleteDialog({
  eventId,
  isOpen,
  onClose,
  mutate,
}: DeleteDialogProps): ReactElement {
  const handleDelete = () => {
    axiosAuth
      .delete<GenericBackendRes>(`events/delete-event/${eventId}`)
      .then(async (res) => {
        toast.success(res.data.message);
        await mutate?.();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data.message ??
            "An error occurred while deleting this event"
        );
      });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header="Delete Event"
      message="Are you sure you want to delete this event? This action cannot be undone."
      btnColor="red"
      confirmationBtnTitle="Delete"
      handleConfirmation={handleDelete}
    />
  );
}

function EditDialog({ mutate, event, isOpen, onClose }: any): ReactElement {
  return (
    <EditEventModal
      mutate={mutate}
      event={event}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}

export default function Event({
  id,
  title,
  description,
  date,
  location,
  imageURL,
  isInterested,
  interest,
  mutateEvents,
}: EventProps): ReactElement {
  const isExpired = Date.now() >= new Date(date).getTime();
  const { user } = useUserContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

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
      {imageURL ? (
        <Box
          width="full"
          height="full"
          position="absolute"
          top={0}
          right={0}
          zIndex={-1}
          filter="blur(2px)"
          bgImg={imageURL}
          bgRepeat="no-repeat"
          bgPosition="center"
          bgSize="cover"
        />
      ) : (
        <Box
          width="full"
          height="full"
          position="absolute"
          top={0}
          right={0}
          zIndex={-1}
          bgImg="linear-gradient(135deg, #81FFEF 10%, #F067B4 100%)"
        />
      )}
      <Box
        position="absolute"
        zIndex={-1}
        top={0}
        right={0}
        width="full"
        height="full"
        bgColor="rgba(0, 0, 0, 0.45)"
      />
      <HStack width="full" justify="space-between" align="flex-end">
        <VStack align="start" spacing={0}>
          <Flex align="center" gap={1}>
            <Text fontWeight="semibold" noOfLines={1} fontSize="18px">
              {title}
            </Text>
          </Flex>
          <Flex align="center" gap={1}>
            {isExpired ? (
              <Badge
                position="absolute"
                top={3}
                right={4}
                variant="subtle"
                colorScheme="red"
              >
                Expired
              </Badge>
            ) : null}
          </Flex>
        </VStack>
        {user?.isAdmin || user?.isAcademicStaff ? (
          <OptionsMenu>
            <MenuList>
              <MenuItem onClick={onEditOpen}>
                <Icon mr={3} as={PencilIcon} h="24px" w="24px" />
                <span>Edit Event</span>
              </MenuItem>
              <MenuItem color="red.500" onClick={onDeleteOpen}>
                <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                <span>Delete Event</span>
              </MenuItem>
            </MenuList>
          </OptionsMenu>
        ) : null}
      </HStack>
      <Spacer />
      <HStack width="full" justify="space-between" align="flex-end">
        <VStack align="start" spacing={0}>
          <Flex align="center" gap={1}>
            <Icon as={ClockIcon} />
            <Text fontSize="sm">{formatEventDate(date)}</Text>
          </Flex>
          <Flex align="center" gap={1}>
            <Icon as={LocationIcon} />
            <Text fontSize="sm">{location}</Text>
          </Flex>
        </VStack>
        <Button size="sm" colorScheme="button" onClick={onOpen}>
          See Details
        </Button>
      </HStack>
      <EventModal
        isOpen={isOpen}
        onClose={onClose}
        event={{
          id,
          title,
          description,
          interest,
          isInterested,
          date,
          imageURL,
          location,
          mutateEvents,
        }}
      />
      <DeleteDialog
        eventId={id}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        mutate={mutateEvents}
      />
      <EditDialog
        mutate={mutateEvents}
        event={{ id, title, description, date, location }}
        isOpen={isEditOpen}
        onClose={onEditClose}
      />
    </Flex>
  );
}
