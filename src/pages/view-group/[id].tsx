import {
    Text,
    Image,
    Flex,
    VStack,
    Divider,
    Box,
    Spinner,
    Button,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Post from "src/components/Post";
import toast from "react-hot-toast";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { Virtuoso } from "react-virtuoso";
import { AxiosError } from "axios";
import { GenericBackendRes, GetFeedRes, GetGroupRes } from "src/types/server";
import { IGroup, IPost } from "src/types/interfaces";
import styles from "src/styles/userProfile.module.scss";
import ComposePost from "src/components/ComposePost";
import { useRouter } from "next/router";
import { axiosAuth } from "src/utils/axios";

interface PostsProps {
    swr: SWRInfiniteResponse<GetFeedRes, AxiosError<GenericBackendRes>>;
}

function Posts({ swr }: PostsProps): ReactElement {
    const [reachedEnd, setReachedEnd] = useState(false);
    const [posts, setPosts] = useState<IPost[]>([]);

    const { data, error, mutate, isValidating, size: page, setSize: setPage } = swr;

    const loadMorePosts = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd)
            return (
                <VStack width="full" my={3}>
                    <Spinner />
                </VStack>
            );

        return null;
    };

    useEffect(() => {
        if (data) {
            setPosts(data.reduce((prev, curr) => prev.concat(curr.posts), [] as IPost[]));

            if (data[data.length - 1].posts.length < 30) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(
                error.response?.data.message ??
                    "An error occurred while fetching the posts",
            );
        }
    }, [data, error]);

    if (!isValidating && data?.[0]?.posts.length === 0)
        return (
            <VStack width="full" textAlign="center">
                <Box boxSize="250px">
                    <Image
                        fit="cover"
                        src="/graphics/Something_Went_Wrong.png"
                        alt="No posts found graphic"
                    />
                </Box>
                <Text fontSize="3xl" fontWeight="bold">
                    There are no posts
                </Text>
            </VStack>
        );

    return (
        <Virtuoso
            className={styles.posts}
            data={posts}
            totalCount={posts.length}
            endReached={loadMorePosts}
            useWindowScroll
            components={{
                Footer,
            }}
            itemContent={(_, post) => (
                <Post
                    key={post.id}
                    id={post.id}
                    author={{
                        id: post.authorId,
                        username: post.authorUsername,
                        name: post.authorName,
                        avatarURL: post.authorAvatarURL,
                    }}
                    attachments={post.attachments}
                    createdAt={post.createdAt}
                    content={post.content}
                    likes={post.likes}
                    liked={post.liked}
                    comments={post.comments}
                    parentAuthorUsername={post.parentAuthorUsername}
                    type={post.type}
                    mutate={mutate}
                    groupName={post.groupName}
                />
            )}
        />
    );
}

export default function ViewGroup(): ReactElement {
    const router = useRouter();
    const { id } = router.query;
    const [group, setGroup] = useState<IGroup | null>(null);
    const getPosts = (pageIndex: number) => {
        return `posts/get-all-posts/${pageIndex}?groupId=${id}`;
    };

    const createPostRoute = `posts/create-post?groupId=${id}`;
    const swr = useSWRInfinite<GetFeedRes, AxiosError<GenericBackendRes>>(
        getPosts,
        fetcher,
        {
            revalidateOnFocus: false,
        },
    );

    useEffect(() => {
        if (id) {
            axiosAuth
                .get<GetGroupRes>(`groups/${id}`)
                .then((res) => {
                    setGroup(res.data.group);
                })
                .catch((error) => {
                    toast.error(
                        (error as AxiosError<GenericBackendRes>).response?.data.message ??
                            "An error occurred while fetching group",
                    );
                });
        }
    }, [id]);

    return (
        <Flex>
            <VStack spacing={4} align="start" width="full">
                <Button onClick={() => router.back()}>Back</Button>
                <Text fontSize="xl" fontWeight="semibold">
                    Group Name: {group?.name}
                </Text>
                <Text fontSize="sm">Description: {group?.description}</Text>
                <Divider height="1px" bgColor="bgSecondary" />
                <ComposePost
                    mutate={swr.mutate}
                    placeholder="Share your thoughts..."
                    apiRoute={createPostRoute}
                    type="Global"
                />
                <Divider height="1px" bgColor="bgSecondary" />
                <Text fontSize="xl" fontWeight="semibold">
                    Group Posts
                </Text>
                <Posts swr={swr} />
            </VStack>
        </Flex>
    );
}
