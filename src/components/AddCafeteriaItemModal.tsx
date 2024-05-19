import { Text, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, VStack, Button, Flex, HStack, Code, IconButton, Icon } from "@chakra-ui/react";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import { MAX_ATTACHMENT_SIZE, SUPPORTED_PROFILE_IMAGE_TYPES } from "src/utils/constants";
import { FileUpload } from "src/components/FileUpload";
import { axiosAuth } from "src/utils/axios";
import { GenericBackendRes, GetCafeteriaItemsRes } from "src/types/server";
import { AxiosError } from "axios";
import { XIcon } from "@heroicons/react/outline";
import { KeyedMutator } from "swr";

interface AddCafeteriaItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    mutate: KeyedMutator<GetCafeteriaItemsRes[]> | null;
}

interface AddCafeteriaItemData {
    name: string;
    price: string;
}

export default function AddCafeteriaItemModal({ isOpen, onClose, mutate }: AddCafeteriaItemModalProps): ReactElement {
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<AddCafeteriaItemData>({
        name: "",
        price: "",
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

        const payload = new FormData();
        if (attachment) {
            payload.append("image", attachment);
        }
        payload.append("name", form.name);
        payload.append("price", form.price);

        axiosAuth.post<GenericBackendRes>("cafeteria/add-item", payload)
            .then((res) => {
                toast.success(res.data.message);
                setSubmitting(false);
                onClose();
                mutate?.();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data?.message ?? "An error occurred while submitting this item");
                setSubmitting(false);
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

    const removeAttachment = () => {
        setAttachment(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bgColor="bgMain">
                <ModalHeader>
                    <Text>Add a Cafeteria Item</Text>
                </ModalHeader>
                <ModalCloseButton size="lg" />
                <ModalBody>
                    <VStack width="full" align="end" spacing={5}>
                        <VStack width="full" spacing={3} align="start">
                            <Input placeholder="Name" name="name" onChange={handleChange} />
                            <Input placeholder="Price in TL" type="number" name="price" onChange={handleChange} />
                            <Flex width="full" wrap="wrap" gap={3}>
                                <FileUpload
                                    acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                                    onInputChange={(e) => handleImageChange(e)}
                                    colorScheme="button"
                                >
                                    Upload Image
                                </FileUpload>
                                {attachment ? (
                                    <HStack flex="1" maxWidth="full">
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
                        </VStack>
                        <Button colorScheme="green" isLoading={isSubmitting} loadingText="Submitting" onClick={handleSubmit}>Add</Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
