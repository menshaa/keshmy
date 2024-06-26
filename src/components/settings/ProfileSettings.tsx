import {
    HStack,
    InputLeftAddon,
    VStack,
    Text,
    Flex,
    Button,
    ButtonGroup,
} from "@chakra-ui/react";
import { ReactElement, useState } from "react";
import Input from "src/components/Input";
import { FileUpload } from "src/components/FileUpload";
import AttachmentPreview from "src/components/AttachmentPreview";
import { MAX_ATTACHMENT_SIZE, SUPPORTED_PROFILE_IMAGE_TYPES } from "src/utils/constants";
import toast from "react-hot-toast";
import { useUserContext } from "src/contexts/userContext";
import { AxiosError } from "axios";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";
import Avatar from "src/components/Avatar";

interface UpdateProfileData {
    name: string;
    surname: string;
    username: string;
}

export default function ProfileSettings(): ReactElement {
    const { user, mutate } = useUserContext();

    const [previewImage, setPreviewImage] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<UpdateProfileData>({
        name: "",
        surname: "",
        username: "",
    });

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target.files as ArrayLike<File>);

        if (!SUPPORTED_PROFILE_IMAGE_TYPES.includes(files[0].type)) {
            toast.error("Unsupported file format");
            return;
        }

        if (files[0].size > MAX_ATTACHMENT_SIZE) {
            toast.error("File size cannot exceed 8MB");
            return;
        }

        setPreviewImage(URL.createObjectURL(files[0]));
        setAttachment(files[0]);
    };

    const removeAttachment = () => {
        setPreviewImage("");
        setAttachment(null);
    };

    const removeProfileImage = async () => {
        removeAttachment();
        try {
            await mutate(axiosAuth.delete("settings/remove-profile-image"), {
                optimisticData: { user: { ...user, avatarURL: null } },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error has occurred while removing the profile image");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleSubmit = () => {
        if (!form.name && !form.surname && !form.username && !attachment) {
            toast.error("At least one field has to be changed");
            return;
        }

        setSubmitting(true);

        const payload = new FormData();
        if (attachment) {
            payload.append("profileImage", attachment);
        }
        payload.append("name", form.name);
        payload.append("surname", form.surname);
        payload.append("username", form.username);

        axiosAuth.patch<GenericBackendRes>("settings/update-profile", payload)
            .then((res) => {
                setSubmitting(false);
                toast.success(res.data.message);
                mutate();
                removeAttachment();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                setSubmitting(false);
                toast.error(e.response?.data?.message ?? "An error has occurred");
            });
    };

    return (
        <VStack align="start" p={3} spacing={6}>
            <HStack width="full" spacing={3}>
                <Input placeholder="Name" name="name" withLabel="Name" defaultValue={user?.name} onChange={handleChange} />
                <Input placeholder="Surname" name="surname" withLabel="Surname" defaultValue={user?.surname} onChange={handleChange} />
            </HStack>
            <Input
                placeholder="Username"
                name="username"
                withLabel="Username"
                defaultValue={user?.username}
                leftAddon={
                    <InputLeftAddon bgColor="text" color="textOpposite" border="none">
                        emusocial.com/@
                    </InputLeftAddon>
                }
                onChange={handleChange}
            />
            <VStack width="full" align="start">
                <Input
                    placeholder="EMU Email"
                    withLabel="Email"
                    defaultValue={user?.email}
                    disabled
                />
                <Text fontSize="xs" color="textMain">
                    Email can&apos;t be changed
                </Text>
            </VStack>
            <VStack width="full" align="start">
                <Text>Profile Photo</Text>
                <Flex
                    width="full"
                    direction={{ base: "column", md: "row" }}
                    align="center"
                    justify={{ base: "center", md: "initial" }}
                    gap={{ base: 3, md: 10 }}
                >
                    {!previewImage && <Avatar src={user?.avatarURL} borderRadius="md" width="150px" height="150px" />}
                    {previewImage && <AttachmentPreview image={previewImage} size="150px" idx={0} removeAttachment={removeAttachment} />}
                    <ButtonGroup colorScheme="button" spacing={4}>
                        {user?.avatarURL ? (
                            <>
                                <FileUpload
                                    acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                                    onInputChange={(e) => handleProfileImageChange(e)}
                                >
                                    Update
                                </FileUpload>
                                <Button variant="outline" onClick={removeProfileImage}>Remove</Button>
                            </>
                        ) : (
                            <FileUpload
                                acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                                onInputChange={(e) => handleProfileImageChange(e)}
                            >
                                Upload
                            </FileUpload>
                        )}
                    </ButtonGroup>
                </Flex>
            </VStack>
            <Button alignSelf="end" colorScheme="green" width="90px" isLoading={isSubmitting} loadingText="Saving" onClick={handleSubmit}>
                Save
            </Button>
        </VStack>
    );
}
