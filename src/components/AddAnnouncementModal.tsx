import { Text, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, VStack, Button } from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import Textarea from "src/components/Textarea";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";

interface AddAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddAnnouncementModal({ isOpen, onClose }: AddAnnouncementModalProps): ReactElement {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: "",
        content: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        axiosAuth.post<GenericBackendRes>("announcements/add-announcement", form)
            .then((res) => {
                toast.success(res.data.message);
                setSubmitting(false);
                onClose();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data?.message ?? "An error occurred while submitting the announcement");
                setSubmitting(false);
            });
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
                            <Textarea placeholder="Content" name="content" onChange={handleChange} rows={14} />
                        </VStack>
                        <Button colorScheme="green" isLoading={isSubmitting} loadingText={"Submitting"} onClick={handleSubmit}>Add</Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
