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
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import Textarea from "src/components/Textarea";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  mutate: any;
}

interface EditArticleData {
  title: string;
  content: string;
}

export default function EditArticleModal({
  mutate,
  article,
  isOpen,
  onClose,
}: EditArticleModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EditArticleData>({
    title: article.title,
    content: article.title,
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

    axiosAuth
      .patch<GenericBackendRes>(`articles/edit-article/${article.id}`, form)
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
            "An error occurred while submitting your article"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit an Article</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3}>
              <Input
                defaultValue={article.title}
                placeholder="Title"
                name="title"
                onChange={handleChange}
              />
              <Textarea
                defaultValue={article.content}
                placeholder="Content"
                name="content"
                rows={14}
                onChange={handleChange}
              />
            </VStack>
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Submitting"
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
