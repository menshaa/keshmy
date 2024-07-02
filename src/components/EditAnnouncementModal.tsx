import {
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  Button,
  Flex,
  HStack,
  Code,
  IconButton,
  Icon,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import Textarea from "src/components/Textarea";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutate: any;
  announcement: any;
}

export default function EditAnnouncementModal({
  isOpen,
  onClose,
  mutate,
  announcement,
}: EditAnnouncementModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: announcement.title,
    content: announcement.content,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();

    payload.append("title", form.title);
    payload.append("content", form.content);

    axiosAuth
      .patch<GenericBackendRes>(
        `announcements/edit-announcement/${announcement.id}`,
        payload
      )
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        if (mutate) {
          await mutate();
        }
        onClose();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the announcement"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit an Announcement</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3}>
              <Input
                defaultValue={announcement.title}
                placeholder="Title"
                name="title"
                onChange={handleChange}
              />
              <Textarea
                defaultValue={announcement.content}
                placeholder="Content"
                name="content"
                onChange={handleChange}
                rows={14}
              />
            </VStack>
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText={"Submitting"}
              onClick={handleSubmit}
            >
              Edit
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
