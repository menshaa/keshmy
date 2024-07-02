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
import toast from "react-hot-toast";
import Input from "src/components/Input";

import { axiosAuth } from "src/utils/axios";
import { GenericBackendRes, GetCafeteriaItemsRes } from "src/types/server";
import { AxiosError } from "axios";

import { KeyedMutator } from "swr";

interface EditCafeteriaItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutate: KeyedMutator<GetCafeteriaItemsRes[]> | null;
  item: any;
}

interface EditCafeteriaItemData {
  name: string;
  price: number;
}

export default function EditCafeteriaItemModal({
  item,
  isOpen,
  onClose,
  mutate,
}: EditCafeteriaItemModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EditCafeteriaItemData>({
    name: item.name,
    price: Number(item.price) || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!form.name || !form.price) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price),
    };
    axiosAuth
      .patch<GenericBackendRes>(`cafeteria/edit-item/${item.id}`, payload)
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        onClose();
        mutate?.();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting this item"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit a Cafeteria Item</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3} align="start">
              <Input
                defaultValue={item.name}
                placeholder="Name"
                name="name"
                onChange={handleChange}
              />
              <Input
                defaultValue={item.price}
                placeholder="Price in TL"
                type="number"
                name="price"
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
