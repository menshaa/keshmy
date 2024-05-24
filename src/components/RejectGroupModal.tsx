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
import { ReactElement, useState } from "react";
import Input from "src/components/Input";

import Textarea from "src/components/Textarea";

import "react-datepicker/dist/react-datepicker.css";

import toast from "react-hot-toast";
import { axiosAuth } from "src/utils/axios";
import { GenericBackendRes, GetMyGroupsRes } from "src/types/server";
import { AxiosError } from "axios";

import { KeyedMutator } from "swr";

interface RejectGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutate?: KeyedMutator<GetMyGroupsRes[]>;
  groupId: string;
}

export default function RejectGroupModal({
  isOpen,
  onClose,
  mutate,
  groupId,
}: RejectGroupModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    rejectReason: "",
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
    if (!form.rejectReason) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    axiosAuth
      .patch<GenericBackendRes>(`groups/${groupId}/request`, {
        approved: false,
        rejectReason: form.rejectReason,
      })
      .then(async (res) => {
        toast.success(res.data.message);
        if (mutate) {
          await mutate();
        }
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Provide a rejection reason</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3} align="start">
              <Textarea
                placeholder="Reason"
                name="rejectReason"
                onChange={handleChange}
              />
            </VStack>
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Submitting"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
