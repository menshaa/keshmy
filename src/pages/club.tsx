import { Flex, Text, VStack, Image, Spinner, Link as ChakraLink, Divider, Box } from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { IClubMember, IPost } from "src/types/interfaces";
import { GenericBackendRes, GetClubMembersRes, GetFeedRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import styles from "src/styles/Club.module.scss";
import Avatar from "src/components/Avatar";
import NextLink from "next/link";
import Post from "src/components/Post";
import { useUserContext } from "src/contexts/userContext";
import ComposePost from "src/components/ComposePost";

interface MemberProps {
    name: string;
    username: string;
    avatarURL: string;
}

function Member({ name, username, avatarURL }: MemberProps): ReactElement {
    return (
        <NextLink href={`/@${username}`} passHref>
            <ChakraLink>
                <VStack width="full">
                    <Avatar src={avatarURL} rounded="lg" width="90px" height="90px" />
                    <Text>{name}</Text>
                </VStack>
            </ChakraLink>
        </NextLink>
    );
}

const getMembersKey = (pageIndex: number) => {
    return `club/get-members/${pageIndex}`;
};

function Members(): ReactElement {
    const [reachedEnd, setReachedEnd] = useState(false);
    const [members, setMembers] = useState<IClubMember[]>([]);

    const { data, error, isValidating, size: page, setSize: setPage } = useSWRInfinite<GetClubMembersRes, AxiosError<GenericBackendRes>>(getMembersKey, fetcher, {
        revalidateOnFocus: false,
    });

    const loadMoreMembers = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd) return (
            <VStack width="full">
                <Spinner />
            </VStack>
        );

        return null;
    };

    useEffect(() => {
        if (data) {
            setMembers(data.reduce((prev, curr) => curr.members.concat(prev), [] as IClubMember[]));

            if (data[data.length - 1].members.length < 15) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error.response?.data.message ?? "An error occurred while fetching members");
        }
    }, [data, error]);

    return (
        <VStack
            flex="4"
            align="start"
            spacing={1}
            height="md"
            maxHeight="calc(100vh - var(--chakra-headerHeight-desktop) - 5rem)"
            position="sticky"
            top="calc(var(--chakra-headerHeight-desktop) + 2.5rem)"
            display={{ base: "none", lg: "flex" }}
        >
            <Text fontWeight="semibold">Members</Text>
            <VStack
                align="start"
                justify="center"
                bgColor="bgPrimary"
                width="full"
                height="full"
                py={5}
                rounded="md"
            >
                {!isValidating && data?.[0]?.members.length === 0 ? (
                    <VStack width="full" spacing={4} textAlign="center">
                        <Image
                            fit="cover"
                            width="150px"
                            src="/graphics/Deleted.png"
                            alt="List is empty graphic"
                        />
                        <Text fontSize="2xl" fontWeight="bold">No members in the club</Text>
                    </VStack>
                ) : (
                    <VirtuosoGrid
                        className={styles.members}
                        data={members}
                        totalCount={members.length}
                        endReached={loadMoreMembers}
                        components={{
                            Footer,
                        }}
                        itemContent={(_, member) => (
                            <Member
                                key={member.id}
                                name={member.name}
                                username={member.username}
                                avatarURL={member.avatarURL ?? ""}
                            />
                        )}
                    />
                )}
            </VStack>
        </VStack>
    );
}

interface ClubPostsProps {
    swr: SWRInfiniteResponse<GetFeedRes, AxiosError<GenericBackendRes>>;
}

function ClubPosts({ swr }: ClubPostsProps): ReactElement {
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
        if (!reachedEnd) return (
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
            toast.error(error.response?.data.message ?? "An error occurred while fetching the posts");
        }
    }, [data, error]);

    if (!isValidating && data?.[0]?.posts.length === 0) return (
        <VStack width="full" textAlign="center">
            <Box boxSize="250px">
                <Image
                    fit="cover"
                    src="/graphics/Something_Went_Wrong.png"
                    alt="No posts found graphic"
                />
            </Box>
            <Text fontSize="3xl" fontWeight="bold">There are no posts</Text>
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
                />
            )}
        />
    );
}

const getPostsKey = (pageIndex: number) => {
    return `club/get-all-posts/${pageIndex}`;
};

export default function Club(): ReactElement {
    const { user } = useUserContext();

    const swr = useSWRInfinite<GetFeedRes, AxiosError<GenericBackendRes>>(getPostsKey, fetcher, {
        revalidateOnFocus: false,
    });

    return (
        <Flex gap="10">
            <VStack spacing={4} align="start" flex="7">
                {user?.isClubMember ? (
                    <>
                        <ComposePost
                            mutate={swr.mutate}
                            placeholder="Make a club post..."
                            apiRoute="club/create-post"
                            type="Club"
                        />
                        <Divider height="1px" bgColor="bgSecondary" />
                    </>
                ) : null}
                <Text fontSize="xl" mb={1} fontWeight="semibold">
                    Club
                </Text>
                <ClubPosts swr={swr}/>
            </VStack>
            <Members />
        </Flex>
    );
}
