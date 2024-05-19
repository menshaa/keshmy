import dynamic from "next/dynamic";
import { Button, ButtonGroup, HStack, Textarea, VStack, Wrap } from "@chakra-ui/react";
import { Camera, NotePencil } from "phosphor-react";
import { ReactElement, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useUserContext } from "src/contexts/userContext";
import { GenericBackendRes, GetFeedRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";
import { MAX_ATTACHMENT_SIZE, SUPPORTED_ATTACHMENTS } from "src/utils/constants";
import { KeyedMutator } from "swr";
const AttachmentPreview = dynamic(() => import("src/components/AttachmentPreview"));
import Avatar from "src/components/Avatar";
import { FileUpload } from "src/components/FileUpload";
import { PostType } from "@prisma/client";

interface ComposePostProps {
    mutate: KeyedMutator<GetFeedRes[]>;
    placeholder: string;
    apiRoute: string;
    type: PostType;
}

export default function ComposePost({ mutate, placeholder, apiRoute, type }: ComposePostProps): ReactElement {
    const { user } = useUserContext();

    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [hasText, setHasText] = useState(false);

    const composePostRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            submitPost();
            return;
        }
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target.files as ArrayLike<File>);
        let anyUnsupported = false;
        let anyTooBig = false;

        if (files.length > 4 || files.length + attachments.length > 4) {
            toast.error("Cannot upload more than 4 attachments");
            return;
        }

        for (let i = 0; i < files.length; i++) {
            if (files[i].size > MAX_ATTACHMENT_SIZE) {
                anyTooBig = true;
                continue;
            }

            if (!SUPPORTED_ATTACHMENTS.includes(files[i].type)) {
                anyUnsupported = true;
                continue;
            }

            setPreviewImages(images => {
                return [...images, URL.createObjectURL(files[i])];
            });

            setAttachments(attachments => {
                return [...attachments, files[i]];
            });
        }

        if (anyUnsupported && anyTooBig) {
            toast.error("Some files exceed the maximum allowed size (8MB) while others are unsupported");
        } else if (anyUnsupported) {
            toast.error("Some file(s) are unsupported");
        } else if (anyTooBig) {
            toast.error("Some file(s) exceed the maximum allowed size (8MB)");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.parentElement!.dataset.value = e.target.value;
        setHasText(!!e.target.value.trim());
    };

    const removeAttachment = (idx: number) => {
        const temp = [...previewImages];
        temp.splice(idx, 1);
        setPreviewImages(temp);

        const temp2 = [...attachments];
        temp2.splice(idx, 1);
        setAttachments(temp2);
    };

    const submitPost = () => {
        if (composePostRef.current && (composePostRef.current?.value.trim().length || attachments.length)) {
            setSubmitting(true);
            setAttachments([]);
            setPreviewImages([]);

            const payload = new FormData();

            payload.append("content", composePostRef.current?.value?.trim() ?? "");
            payload.append("type", type);
            attachments.forEach((a) => payload.append("attachments", a));

            composePostRef.current.value = "";
            setHasText(false);

            axiosAuth.post<GenericBackendRes>(apiRoute, payload)
                .then(async () => {
                    setSubmitting(false);
                    await mutate();
                })
                .catch((e) => {
                    toast.error(e.response?.data.message ?? "An error occurred while submitting your post");
                    setSubmitting(false);
                });
        }
    };

    return (
        <VStack spacing={4} align="start" width="full">
            <VStack
                bgColor="bgSecondary"
                borderRadius="compose"
                p={4}
                spacing={6}
                align="start"
                width="full"
                border="1px solid"
                borderColor="stroke"
                _hover={{ borderColor: "gray.400" }}
                _focusWithin={{
                    borderColor: "button.400",
                    boxShadow: "0 0 0 1px var(--chakra-colors-button-400)",
                }}
            >
                <HStack align="start" gap={2} width="full">
                    <Avatar src={user?.avatarURL} rounded="lg" width="40px" height="40px" />
                    <Textarea
                        ref={composePostRef}
                        placeholder={placeholder}
                        resize="none"
                        border="none"
                        px={0}
                        _focusVisible={{ border: "none" }}
                        _placeholder={{ color: "textMain", opacity: 0.8 }}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                    />
                </HStack>
                <Wrap spacing={4} width="full" overflow="unset">
                    {previewImages.map((image, i) => (
                        <AttachmentPreview
                            key={i}
                            image={image}
                            idx={i}
                            removeAttachment={removeAttachment}
                        />
                    ))}
                </Wrap>
            </VStack>
            <ButtonGroup size="sm" colorScheme="button">
                <Button
                    width={32}
                    rounded="lg"
                    rightIcon={<NotePencil weight="bold" size="22" />}
                    disabled={(!hasText && !attachments.length) || isSubmitting}
                    isLoading={isSubmitting}
                    loadingText="Creating"
                    onClick={submitPost}
                >
                    Post
                </Button>
                <FileUpload
                    variant="outline"
                    rounded="lg"
                    rightIcon={<Camera weight="bold" size="22" />}
                    disabled={isSubmitting}
                    acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onInputChange={(e) => handleAttachmentChange(e)}
                >
                    Media
                </FileUpload>
            </ButtonGroup>
        </VStack>
    );
}
