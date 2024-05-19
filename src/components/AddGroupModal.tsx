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

interface AddGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    mutate: KeyedMutator<GetMyGroupsRes[]>;
}

export default function AddGroupModal({
    isOpen,
    onClose,
    mutate,
}: AddGroupModalProps): ReactElement {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const name = e.target.name;
        const value = e.target.value;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleSubmit = () => {
        if (!form.name || !form.description) {
            toast.error("All fields must be filled");
            return;
        }

        setSubmitting(true);

        const payload = {
            name: form.name,
            description: form.description,
        };

        axiosAuth
            .post<GenericBackendRes>("groups/create-group", payload)
            .then(async (res) => {
                toast.success(res.data.message);
                setSubmitting(false);
                await mutate();
                onClose();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(
                    e.response?.data?.message ??
                        "An error occurred while submitting the event",
                );
                setSubmitting(false);
            });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bgColor="bgMain">
                <ModalHeader>
                    <Text>Create a Group</Text>
                </ModalHeader>
                <ModalCloseButton size="lg" />
                <ModalBody>
                    <VStack width="full" align="end" spacing={5}>
                        <VStack width="full" spacing={3} align="start">
                            <Input
                                placeholder="Group Name"
                                name="name"
                                onChange={handleChange}
                            />
                            <Textarea
                                placeholder="Description"
                                name="description"
                                onChange={handleChange}
                            />
                        </VStack>
                        <Button
                            colorScheme="green"
                            isLoading={isSubmitting}
                            loadingText="Submitting"
                            onClick={handleSubmit}
                        >
                            Create
                        </Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
