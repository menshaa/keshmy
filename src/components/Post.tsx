import {
  Grid,
  GridItem,
  VStack,
  Text,
  MenuList,
  MenuItem,
  ButtonGroup,
  Button,
  Icon,
  Link as ChakraLink,
  useDisclosure,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Divider,
  HStack,
  IconButton,
  Box,
  Wrap,
  Textarea,
  LinkBox,
  LinkOverlay,
  ModalHeader,
  ModalCloseButton,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/solid";
import { Camera, Chat, NotePencil, ThumbsUp } from "phosphor-react";
import { ReactElement, useRef, useState } from "react";
import OptionsMenu from "src/components/Options";
import RelativeTime from "src/components/RelativeTime";
import NextLink from "next/link";
import { Dialog } from "src/components/Dialog";
import { axiosAuth } from "src/utils/axios";
import { AxiosError } from "axios";
import {
  GenericBackendRes,
  GetCommentsRes,
  GetFeedRes,
  GetPostsRes,
} from "src/types/server";
import toast from "react-hot-toast";
import { IPostAuthor } from "src/types/interfaces";
import Avatar from "src/components/Avatar";
import { useUserContext } from "src/contexts/userContext";
import Attachments from "src/components/AttachmentsContainer";
import { KeyedMutator } from "swr";
import { IconFileUpload } from "src/components/FileUpload";
import AttachmentPreview from "src/components/AttachmentPreview";
import {
  MAX_ATTACHMENT_SIZE,
  SUPPORTED_ATTACHMENTS,
} from "src/utils/constants";
import { PostType } from "@prisma/client";
import { useRouter } from "next/router";
import { PencilIcon } from "@heroicons/react/outline";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostProps;
  mutate:
    | KeyedMutator<GetFeedRes[]>
    | KeyedMutator<GetPostsRes[]>
    | KeyedMutator<GetCommentsRes[]>;
}

interface DateProps {
  postDate: string;
}

function PostDate({ postDate }: DateProps): ReactElement {
  const date = new Date(postDate);

  const finalDate = `${date.toLocaleDateString()} · ${date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;

  return (
    <Text fontSize="sm" color="textMain">
      {finalDate}
    </Text>
  );
}

function CommentModal({
  isOpen,
  onClose,
  post,
  mutate,
}: CommentModalProps): ReactElement {
  const initialFocusRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useUserContext();
  const router = useRouter();
  const { id: groupId } = router.query;

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [hasText, setHasText] = useState(false);

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

      setPreviewImages((images) => {
        return [...images, URL.createObjectURL(files[i])];
      });

      setAttachments((attachments) => {
        return [...attachments, files[i]];
      });
    }

    if (anyUnsupported && anyTooBig) {
      toast.error(
        "Some files exceed the maximum allowed size (8MB) while others are unsupported"
      );
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

  const submitPost = () => {
    if (
      initialFocusRef.current &&
      (initialFocusRef.current?.value.trim().length || attachments.length)
    ) {
      setSubmitting(true);
      setAttachments([]);
      setPreviewImages([]);

      const payload = new FormData();

      payload.append("content", initialFocusRef.current?.value?.trim() ?? "");
      payload.append("parentId", post.id);
      attachments.forEach((a) => payload.append("attachments", a));
      const createPostRoute = groupId
        ? `posts/create-post?groupId=${groupId}`
        : "posts/create-post";

      initialFocusRef.current.value = "";
      setHasText(false);

      axiosAuth
        .post<GenericBackendRes>(createPostRoute, payload)
        .then(async () => {
          setSubmitting(false);
          onClose();
          toast.success("Successfully commented");
          mutate();
        })
        .catch((e) => {
          toast.error(
            e.response?.data.message ??
              "An error occurred while submitting your post"
          );
          setSubmitting(false);
        });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      submitPost();
      return;
    }
  };

  const removeAttachment = (idx: number) => {
    const temp = [...previewImages];
    temp.splice(idx, 1);
    setPreviewImages(temp);

    const temp2 = [...attachments];
    temp2.splice(idx, 1);
    setAttachments(temp2);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialFocusRef}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalBody py={6} px={0}>
          <VStack px={5}>
            <Grid
              width="full"
              rowGap={3}
              columnGap={5}
              templateColumns="max-content 1fr max-content"
            >
              <NextLink href={`/@${post.author.username}`} passHref>
                <GridItem as={ChakraLink}>
                  <Avatar
                    src={post.author.avatarURL}
                    rounded="lg"
                    width="50px"
                    height="50px"
                  />
                </GridItem>
              </NextLink>
              <GridItem alignSelf="center">
                <VStack align="start" spacing={0}>
                  <NextLink href={`/@${post.author.username}`} passHref>
                    <ChakraLink>
                      <Text fontSize="md" fontWeight="semibold">
                        {post.author.name ?? post.author.username}
                      </Text>
                      <Text fontSize="sm" color="textMain">
                        @{post.author.username}
                      </Text>
                    </ChakraLink>
                  </NextLink>
                </VStack>
              </GridItem>
              {post.parentAuthorUsername ? (
                <GridItem colStart={1} colEnd={3}>
                  <Text
                    fontSize="sm"
                    color="textMain"
                    wordBreak="break-word"
                    whiteSpace="break-spaces"
                  >
                    Replying to{" "}
                    <NextLink href={`/@${post.parentAuthorUsername}`} passHref>
                      <ChakraLink
                        fontWeight="semibold"
                        color="var(--chakra-colors-accent-500)"
                      >
                        @{post.parentAuthorUsername}
                      </ChakraLink>
                    </NextLink>
                  </Text>
                </GridItem>
              ) : null}
              <GridItem colStart={1} colEnd={4}>
                <Text
                  wordBreak="break-word"
                  fontSize="xl"
                  whiteSpace="break-spaces"
                >
                  {post.content}
                </Text>
              </GridItem>
              {post.attachments ? (
                <GridItem colStart={1} colEnd={4}>
                  <Attachments urls={post.attachments} />
                </GridItem>
              ) : null}
              <GridItem colStart={1} colEnd={4}>
                <PostDate postDate={post.createdAt} />
              </GridItem>
            </Grid>
          </VStack>
          <Divider my={4} height="1px" bgColor="bgSecondary" />
          <VStack width="full" px={5} spacing={4}>
            {previewImages.length > 0 ? (
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
            ) : null}
            <HStack width="full" align="start">
              <Avatar
                src={user?.avatarURL}
                rounded="lg"
                width="40px"
                height="40px"
              />
              <Box
                // some weird hack to have the input expand vertically how we want it to
                sx={{
                  "&::after": {
                    content: 'attr(data-value) " "',
                    visibility: "hidden",
                    whiteSpace: "pre-wrap",
                    gridArea: "1/1",
                    wordWrap: "anywhere",
                  },
                }}
                transitionProperty="var(--chakra-transition-property-common)"
                transitionDuration="var(--chakra-transition-duration-normal)"
                rounded="10px"
                bgColor="bgSecondary"
                width="full"
                maxHeight="100px"
                border="1px solid"
                borderColor="stroke"
                overflow="auto"
                display="inline-grid"
                alignItems="stretch"
                _hover={{ borderColor: "button.400" }}
                _focusWithin={{
                  borderColor: "text",
                  boxShadow: "0 0 0 1px var(--chakra-colors-text)",
                }}
              >
                <Textarea
                  ref={initialFocusRef}
                  placeholder="Leave a comment..."
                  rows={1}
                  border="0px"
                  resize="none"
                  gridArea="1/1"
                  focusBorderColor="none"
                  _placeholder={{ color: "textMain", opacity: 0.8 }}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                />
              </Box>
              <ButtonGroup colorScheme="button">
                <IconFileUpload
                  variant="outline"
                  rounded="lg"
                  aria-label="Add Media"
                  icon={<Camera weight="bold" size="22" />}
                  disabled={isSubmitting}
                  acceptedFileTypes="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onInputChange={(e) => handleAttachmentChange(e)}
                />
                <IconButton
                  size="md"
                  aria-label="Create Comment"
                  icon={<Icon as={NotePencil} w={6} h={6} />}
                  disabled={(!hasText && !attachments.length) || isSubmitting}
                  onClick={submitPost}
                />
              </ButtonGroup>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

interface PostProps {
  id: string;
  content: string;
  author: IPostAuthor;
  createdAt: string;
  attachments: string[] | null;
  likes: number;
  liked: boolean;
  comments: number;
  parentAuthorUsername: string | null;
  type: PostType;
  groupName?: string | null;
  mutate:
    | KeyedMutator<GetFeedRes[]>
    | KeyedMutator<GetPostsRes[]>
    | KeyedMutator<GetCommentsRes[]>;
}

interface OptionsProps {
  openDeleteDialog: () => void;
  openEditModal: () => void;
}

interface DeleteDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  mutate:
    | KeyedMutator<GetFeedRes[]>
    | KeyedMutator<GetPostsRes[]>
    | KeyedMutator<GetCommentsRes[]>;
}

function Options({
  openDeleteDialog,
  openEditModal,
}: OptionsProps): ReactElement {
  return (
    <OptionsMenu buttonSize="34px">
      <MenuList>
        <MenuItem onClick={openEditModal}>
          <Icon mr={3} as={PencilIcon} h="24px" w="24px" />
          <span>Edit Post</span>
        </MenuItem>
        <MenuItem color="red.500" onClick={openDeleteDialog}>
          <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
          <span>Delete Post</span>
        </MenuItem>
      </MenuList>
    </OptionsMenu>
  );
}

function DeleteDialog({
  postId,
  isOpen,
  onClose,
  mutate,
}: DeleteDialogProps): ReactElement {
  const handleDelete = () => {
    axiosAuth
      .delete<GenericBackendRes>(`posts/delete-post?postId=${postId}`)
      .then((res) => {
        toast.success(res.data.message);
        mutate();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data.message ??
            "An error occurred while deleting your post"
        );
      });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header="Delete Post"
      message="Are you sure you want to delete this post? This action cannot be undone."
      btnColor="red"
      confirmationBtnTitle="Delete"
      handleConfirmation={handleDelete}
    />
  );
}

function EditModal({
  isOpen,
  onClose,
  post,
  mutate,
}: CommentModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    content: post.content,
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
    if (!form.content) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    const payload = {
      content: form.content,
    };
    axiosAuth
      .patch<GenericBackendRes>(`posts/${post.id}`, payload)
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
            "An error occurred while submitting the post"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit a Post</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3}>
              <Textarea
                defaultValue={post.content}
                placeholder="Content"
                name="content"
                onChange={handleChange}
                rows={3}
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

export default function Post(props: PostProps): ReactElement {
  const { user } = useUserContext();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();
  const {
    isOpen: isCommentModalOpen,
    onOpen: onOpenCommentModal,
    onClose: onCloseCommentModal,
  } = useDisclosure();

  const {
    isOpen: isEditModalOpen,
    onOpen: onOpenEditModal,
    onClose: onCloseEditModal,
  } = useDisclosure();
  const commentBtnColor = useColorModeValue("button", "gray");
  const likeBtnColor = useColorModeValue("accent", "accent");

  const [likeDisabled, setLikeDisabled] = useState(false);

  const handleLike = async () => {
    if (likeDisabled) {
      return;
    }

    setLikeDisabled(true);

    axiosAuth
      .patch(`posts/${props.liked ? "unlike" : "like"}/${props.id}`)
      .then(async () => {
        await props.mutate();
        setLikeDisabled(false);
      })
      .catch(() => {
        setLikeDisabled(false);
      });
  };

  return (
    <>
      <LinkBox width="full">
        <VStack
          width="full"
          rounded="4px"
          overflow="hidden"
          bgColor="bgPrimary"
        >
          <Grid
            p={3}
            width="full"
            rowGap={2}
            columnGap={4}
            templateColumns="max-content 1fr max-content"
          >
            <NextLink href={`/@${props.author.username}`} passHref>
              <GridItem as={ChakraLink}>
                <Avatar
                  src={props.author.avatarURL}
                  rounded="lg"
                  width="50px"
                  height="50px"
                />
              </GridItem>
            </NextLink>
            <GridItem py={1}>
              <VStack align="start" spacing={0}>
                <HStack spacing={1}>
                  <NextLink href={`/@${props.author.username}`} passHref>
                    <ChakraLink>
                      <Text fontSize="md" fontWeight="semibold">
                        {props.author.name ?? props.author.username}
                      </Text>
                    </ChakraLink>
                  </NextLink>
                  <Text fontSize="xs" color="textMain">
                    · <RelativeTime date={props.createdAt} />
                  </Text>
                </HStack>
                {props.parentAuthorUsername ? (
                  <Text
                    fontSize="sm"
                    color="textMain"
                    wordBreak="break-word"
                    whiteSpace="break-spaces"
                  >
                    Replying to{" "}
                    <NextLink href={`/@${props.parentAuthorUsername}`} passHref>
                      <ChakraLink
                        fontWeight="semibold"
                        color="var(--chakra-colors-accent-500)"
                      >
                        @{props.parentAuthorUsername}
                      </ChakraLink>
                    </NextLink>
                  </Text>
                ) : null}
                {props.groupName ? (
                  <Text
                    fontSize="sm"
                    color="textMain"
                    wordBreak="break-word"
                    whiteSpace="break-spaces"
                  >
                    Posted in {props.groupName}
                  </Text>
                ) : null}
              </VStack>
            </GridItem>
            {props.author.id === user?.id ? (
              <GridItem zIndex={1}>
                <Options
                  openDeleteDialog={onOpenDeleteDialog}
                  openEditModal={onOpenEditModal}
                />
              </GridItem>
            ) : null}
            <GridItem colStart={2}>
              <NextLink
                href={`/@${props.author.username}/${props.id}`}
                passHref
              >
                <LinkOverlay>
                  <Text wordBreak="break-word" whiteSpace="break-spaces">
                    {props.content}
                  </Text>
                </LinkOverlay>
              </NextLink>
            </GridItem>
            {props.attachments ? (
              <GridItem colStart={2} colEnd={4}>
                <Attachments urls={props.attachments} />
              </GridItem>
            ) : null}
          </Grid>
          <ButtonGroup width="full" spacing={0.5}>
            <Button
              width="full"
              colorScheme={likeBtnColor}
              rounded="none"
              height={12}
              leftIcon={
                <ThumbsUp weight={props.liked ? "fill" : "bold"} size="20" />
              }
              onClick={handleLike}
            >
              Like {props.likes > 0 ? `(${props.likes})` : null}
            </Button>
            <Button
              width="full"
              colorScheme={commentBtnColor}
              rounded="none"
              height={12}
              disabled={props.type === "Club" && !user?.isClubMember}
              leftIcon={<Chat weight="bold" size="20" />}
              onClick={() => onOpenCommentModal()}
            >
              Comment {props.comments > 0 ? `(${props.comments})` : null}
            </Button>
          </ButtonGroup>
        </VStack>
      </LinkBox>
      <DeleteDialog
        postId={props.id}
        isOpen={isDeleteDialogOpen}
        onClose={onCloseDeleteDialog}
        mutate={props.mutate}
      />
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={onCloseCommentModal}
        post={props}
        mutate={props.mutate}
      />
      <EditModal
        isOpen={isEditModalOpen}
        onClose={onCloseEditModal}
        post={props}
        mutate={props.mutate}
      />
    </>
  );
}
