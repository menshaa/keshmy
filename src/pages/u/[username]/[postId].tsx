import { Flex, VStack, Text, Grid, Link as ChakraLink, GridItem, ButtonGroup, Button, useColorModeValue, MenuList, MenuItem, Icon, useDisclosure, Wrap, HStack, Box, Textarea, IconButton, Spinner, Tag } from "@chakra-ui/react";
import { AxiosError } from "axios";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { MutableRefObject, ReactElement, useEffect, useRef, useState } from "react";
import { IPost } from "src/types/interfaces";
import { GenericBackendRes, GetCommentsRes, GetPostRes } from "src/types/server";
import { axiosAuth, axiosNoAuth } from "src/utils/axios";
import NextLink from "next/link";
import Avatar from "src/components/Avatar";
import OptionsMenu from "src/components/Options";
import Attachments from "src/components/AttachmentsContainer";
import { useUserContext } from "src/contexts/userContext";
import { Camera, Chat, NotePencil, ThumbsUp } from "phosphor-react";
import toast from "react-hot-toast";
import { Dialog } from "src/components/Dialog";
import { TrashIcon } from "@heroicons/react/solid";
import AttachmentPreview from "src/components/AttachmentPreview";
import { IconFileUpload } from "src/components/FileUpload";
import { MAX_ATTACHMENT_SIZE, SUPPORTED_ATTACHMENTS } from "src/utils/constants";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { Virtuoso } from "react-virtuoso";
import Post from "src/components/Post";
import styles from "src/styles/userProfile.module.scss";
import { KeyedMutator } from "swr";
import Router from "next/router";
import { PostType } from "@prisma/client";

interface OptionsProps {
    openDeleteDialog: () => void;
}

interface DeleteDialogProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}

function Options({ openDeleteDialog }: OptionsProps): ReactElement {
    return (
        <OptionsMenu buttonSize="34px">
            <MenuList>
                <MenuItem color="red.500" onClick={openDeleteDialog}>
                    <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                    <span>Delete Post</span>
                </MenuItem>
            </MenuList>
        </OptionsMenu>
    );
}

function DeleteDialog({ postId, isOpen, onClose }: DeleteDialogProps): ReactElement {
    const handleDelete = () => {
        axiosAuth.delete<GenericBackendRes>(`posts/delete-post?postId=${postId}`)
            .then((res) => {
                toast.success(res.data.message);
                Router.back();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data.message ?? "An error occurred while deleting your post");
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

interface DateProps {
    postDate: string;
}

function PostDate({ postDate }: DateProps): ReactElement {
    const date = new Date(postDate);

    const finalDate = `${date.toLocaleDateString()} · ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;

    return (
        <Text fontSize="sm" color="textMain">
            {finalDate}
        </Text>
    );
}

interface OriginalPostProps extends Props {
    commentBoxRef: MutableRefObject<HTMLTextAreaElement | null>;
}

function OriginalPost({ post, commentBoxRef }: OriginalPostProps): ReactElement {
    const { user } = useUserContext();
    const commentBtnColor = useColorModeValue("button", "gray");
    const likeBtnColor = useColorModeValue("accent", "accent");
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [likeDisabled, setLikeDisabled] = useState(false);
    const [likes, setLikes] = useState(post.likes);
    const [liked, setLiked] = useState(post.liked);

    const handleLike = async () => {
        if (likeDisabled) {
            return;
        }

        setLikeDisabled(true);

        axiosAuth.patch(`posts/${liked ? "unlike" : "like"}/${post.id}`)
            .then(() => {
                liked ? setLikes(likes - 1) : setLikes(likes + 1);
                setLiked(!liked);
                setLikeDisabled(false);
            })
            .catch(() => {
                setLikeDisabled(false);
            });
    };

    const handleComment = () => {
        commentBoxRef?.current?.focus();
    };

    return (
        <>
            <VStack width="full" rounded="4px" overflow="hidden" bgColor="bgPrimary">
                <Grid
                    p={4}
                    width="full"
                    rowGap={3}
                    columnGap={5}
                    templateColumns="max-content 1fr max-content"
                >
                    <NextLink href={`/@${post.authorUsername}`} passHref>
                        <GridItem as={ChakraLink}>
                            <Avatar src={post.authorAvatarURL} rounded="lg" width="50px" height="50px" />
                        </GridItem>
                    </NextLink>
                    <GridItem alignSelf="center">
                        <VStack align="start" spacing={0}>
                            <NextLink href={`/@${post.authorUsername}`} passHref>
                                <ChakraLink>
                                    <Text fontSize="md" fontWeight="semibold">
                                        {post.authorName ?? post.authorUsername}
                                    </Text>
                                    <Text fontSize="sm" color="textMain">
                                        @{post.authorUsername}
                                    </Text>
                                </ChakraLink>
                            </NextLink>
                        </VStack>
                    </GridItem>
                    {post.authorId === user?.id ? (
                        <GridItem zIndex={1}>
                            <Options openDeleteDialog={onOpen} />
                        </GridItem>
                    ) : null}
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
                                    <ChakraLink fontWeight="semibold" color="var(--chakra-colors-accent-500)">
                                        @{post.parentAuthorUsername}
                                    </ChakraLink>
                                </NextLink>
                            </Text>
                        </GridItem>
                    ) : null}
                    {post.groupName ? (
                                    <Text
                                        fontSize="sm"
                                        color="textMain"
                                        wordBreak="break-word"
                                        whiteSpace="break-spaces"
                                    >
                                        Posted in {post.groupName} group
                                        <NextLink
                                            href={`/@${post.parentAuthorUsername}`}
                                            passHref
                                        >
                                            <ChakraLink
                                                fontWeight="semibold"
                                                color="var(--chakra-colors-accent-500)"
                                            >
                                                {post.groupName}
                                            </ChakraLink>
                                        </NextLink>
                                    </Text>
                                ) : null}
                    {post.type === "Club" ? (
                        <GridItem colStart={1} colEnd={3}>
                            <Tag colorScheme="accent">Club Post</Tag>
                        </GridItem>
                    ) : null}
                    <GridItem colStart={1} colEnd={4}>
                        <Text wordBreak="break-word" fontSize="xl" whiteSpace="break-spaces">{post.content}</Text>
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
                <ButtonGroup width="full" spacing={0.5}>
                    <Button
                        width="full"
                        colorScheme={likeBtnColor}
                        rounded="none"
                        height={12}
                        leftIcon={<ThumbsUp weight={liked ? "fill" : "bold"} size="20" />}
                        onClick={handleLike}
                    >
                        Like {likes > 0 ? `(${likes})` : null}
                    </Button>
                    <Button
                        width="full"
                        colorScheme={commentBtnColor}
                        rounded="none"
                        height={12}
                        disabled={post.type === "Club" && !user?.isClubMember}
                        leftIcon={<Chat weight="bold" size="20" />}
                        onClick={handleComment}
                    >
                        Comment {post.comments > 0 ? `(${post.comments})` : null}
                    </Button>
                </ButtonGroup>
            </VStack>
            <DeleteDialog postId={post.id} isOpen={isOpen} onClose={onClose} />
        </>
    );
}

interface CommentBoxProps {
    parentId: string;
    parentType: PostType;
    commentBoxRef: MutableRefObject<HTMLTextAreaElement | null>;
    mutate: KeyedMutator<GetCommentsRes[]>;
}

function CommentBox({ parentId, parentType, commentBoxRef, mutate }: CommentBoxProps): ReactElement {
    const { user } = useUserContext();

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

    const submitPost = () => {
        if (commentBoxRef.current && (commentBoxRef.current?.value.trim().length || attachments.length)) {
            setSubmitting(true);
            setAttachments([]);
            setPreviewImages([]);

            const payload = new FormData();

            payload.append("content", commentBoxRef.current?.value?.trim() ?? "");
            payload.append("type", parentType);
            payload.append("parentId", parentId);
            attachments.forEach((a) => payload.append("attachments", a));

            commentBoxRef.current.value = "";
            setHasText(false);

            axiosAuth.post<GenericBackendRes>("posts/create-post", payload)
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
        <Box bgColor="bgPrimary" py={5} width="full" borderBottom="1px solid var(--chakra-colors-bgSecondary)">
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
                    <Avatar src={user?.avatarURL} rounded="lg" width="40px" height="40px" />
                    <Box
                        // some weird hack to have the input expand vertically how we want it to
                        sx={{
                            "&::after": {
                                content: "attr(data-value) \" \"",
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
                            ref={commentBoxRef}
                            placeholder="Comment..."
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
        </Box>
    );
}

interface CommentsProps {
    swr: SWRInfiniteResponse<GetCommentsRes, AxiosError<GenericBackendRes>>;
}

function Comments({ swr }: CommentsProps): ReactElement {
    const { data, error, mutate, size: page, setSize: setPage } = swr;

    const [reachedEnd, setReachedEnd] = useState(false);
    const [comments, setComments] = useState<IPost[]>([]);

    const loadMoreComments = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd) return (
            <VStack width="full" my={3}>
                <Spinner />
            </VStack>
        );

        return null;
    };

    useEffect(() => {
        if (data) {
            setComments(data.reduce((prev, curr) => prev.concat(curr.comments), [] as IPost[]));

            if (data[data.length - 1].comments.length < 20) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error.response?.data.message ?? "An error occurred while fetching the comments");
        }
    }, [data, error]);

    return (
        <VStack
            spacing={0}
            bgColor="bgPrimary"
            flex="1"
            width="full"
            minHeight="1px" // HACK: used to get the scrollbar to play nice
        >
            <Virtuoso
                className={styles.posts}
                data={comments}
                totalCount={comments.length}
                endReached={loadMoreComments}
                useWindowScroll
                components={{
                    Footer,
                }}
                itemContent={(_, comment) => (
                    <Post
                        key={comment.id}
                        id={comment.id}
                        author={{
                            id: comment.authorId,
                            username: comment.authorUsername,
                            name: comment.authorName,
                            avatarURL: comment.authorAvatarURL,
                        }}
                        attachments={comment.attachments}
                        createdAt={comment.createdAt}
                        content={comment.content}
                        likes={comment.likes}
                        liked={comment.liked}
                        comments={comment.comments}
                        parentAuthorUsername={comment.parentAuthorUsername}
                        type={comment.type}
                        mutate={mutate}
                    />
                )}
            />
        </VStack>
    );
}

interface Props {
    post: IPost;
}

export default function PostPage({ post }: Props): ReactElement {
    const { user } = useUserContext();

    const commentBoxRef = useRef<HTMLTextAreaElement | null>(null);

    const getKey = (pageIndex: number) => {
        return `posts/get-comments/${post.id}/${pageIndex}`;
    };

    const swr = useSWRInfinite<GetCommentsRes, AxiosError<GenericBackendRes>>(getKey, fetcher, {
        revalidateOnFocus: false,
    });

    return (
        <Flex gap="10">
            <VStack
                minHeight={{
                    base: "calc(100vh - var(--chakra-headerHeight-mobile) - var(--chakra-navBarHeight))",
                    lg: "calc(100vh - var(--chakra-headerHeight-desktop) - 2.5rem)"
                }}
                spacing={0}
                align="start"
                flex="7"
                mb={{ base: "var(--chakra-navBarHeight)", lg: "0" }}
            >
                <OriginalPost post={post} commentBoxRef={commentBoxRef} />
                {post.type === "Club" && !user?.isClubMember ? (
                    null
                ) : (
                    <CommentBox parentId={post.id} parentType={post.type} commentBoxRef={commentBoxRef} mutate={swr.mutate} />
                )}
                <Comments swr={swr} />
            </VStack>
        </Flex>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Props>> {
    let post: IPost | null = null;

    try {
        const res = await axiosNoAuth.get<GetPostRes>(`posts/get-post/${context.params?.postId}`, {
            withCredentials: true,
            headers: {
                Cookie: `session=${context.req.cookies.session}`
            }
        });
        post = res.data.post ?? null;
    } catch (e) {
        if ((e as AxiosError).response?.status === 404) {
            return {
                notFound: true,
            };
        }
        console.error(e);
    }

    if (!post) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            post,
        },
    };
}
