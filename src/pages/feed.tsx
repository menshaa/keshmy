import { Text, Image, Flex, VStack, Divider, Box, Spinner } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Post from "src/components/Post";
import toast from "react-hot-toast";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { Virtuoso } from "react-virtuoso";
import { AxiosError } from "axios";
import { GenericBackendRes, GetFeedRes } from "src/types/server";
import { IPost } from "src/types/interfaces";
import styles from "src/styles/userProfile.module.scss";
import ComposePost from "src/components/ComposePost";

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
                    groupName={""}
                />
            )}
        />
    );
}

export default function Feed(): ReactElement {
    const getKey = (pageIndex: number) => {
        return `posts/get-all-posts/${pageIndex}`;
    };

    const swr = useSWRInfinite<GetFeedRes, AxiosError<GenericBackendRes>>(
        getKey,
        fetcher,
        {
            revalidateOnFocus: false,
        },
    );

    return (
        <Flex>
            <VStack spacing={4} align="start" width="full">
                <ComposePost
                    mutate={swr.mutate}
                    placeholder="Share your thoughts..."
                    apiRoute="posts/create-post"
                    type="Global"
                />
                <Divider height="1px" bgColor="bgSecondary" />
                <Text fontSize="xl" fontWeight="semibold">
                    Feed
                </Text>
                <Posts swr={swr} />
            </VStack>
        </Flex>
    );
}
