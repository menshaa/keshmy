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
import {
  MAX_ATTACHMENT_SIZE,
  SUPPORTED_PROFILE_IMAGE_TYPES,
} from "src/utils/constants";
import { FileUpload } from "./FileUpload";
import { XIcon } from "@heroicons/react/outline";

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAnnouncementModal({
  isOpen,
  onClose,
}: AddAnnouncementModalProps): ReactElement {
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files as ArrayLike<File>);

    if (!SUPPORTED_PROFILE_IMAGE_TYPES.includes(files[0].type)) {
      toast.error("Unsupported file format");
      return;
    }

    if (files[0].size > MAX_ATTACHMENT_SIZE) {
      toast.error("File size cannot exceed 8MB");
      return;
    }

    setAttachment(files[0]);
  };

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    if (attachment) {
      payload.append("image", attachment);
    }
    payload.append("title", form.title);
    payload.append("content", form.content);

    axiosAuth
      .post<GenericBackendRes>("announcements/add-announcement", payload)
      .then((res) => {
        toast.success(res.data.message);
        setSubmitting(false);
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

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Add an Announcement</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3}>
              <Input placeholder="Title" name="title" onChange={handleChange} />
              <Flex width="full" wrap="wrap" gap={3}>
                <FileUpload
                  acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                  onInputChange={(e) => handleImageChange(e)}
                  colorScheme="button"
                >
                  Upload Image
                </FileUpload>
                {attachment ? (
                  <HStack flex="1" maxWidth="100%">
                    <Code noOfLines={1} fontWeight="bold" bgColor="bgSecondary">
                      {attachment.name}
                    </Code>{" "}
                    <Text>selected</Text>
                    <IconButton
                      colorScheme="red"
                      size="sm"
                      aria-label="Remove Attachment"
                      icon={<Icon as={XIcon} w={6} h={6} />}
                      onClick={removeAttachment}
                    />
                  </HStack>
                ) : null}
              </Flex>
              <Textarea
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
              Add
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
