import {
    Flex,
    HStack,
    Button,
    Text,
    Image,
    Tag,
    Icon,
    VStack,
    Box,
    Spinner,
} from "@chakra-ui/react";
import { ChatCenteredDots } from "phosphor-react";
import { ReactElement, useEffect, useState } from "react";
import Post from "src/components/Post";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { IPost, IUser } from "src/types/interfaces";
import { GenericBackendRes, GetPostsRes, GetUserRes, StartConversationRes } from "src/types/server";
import { axiosAuth, axiosNoAuth } from "src/utils/axios";
import Avatar from "src/components/Avatar";
import { AxiosError } from "axios";
import { useUserContext } from "src/contexts/userContext";
import toast from "react-hot-toast";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import Router from "next/router";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/userProfile.module.scss";

interface Props {
    user: IUser;
}

function Chat(): ReactElement {
    return <ChatCenteredDots size="24" />;
}

function Tags({ user }: Props): ReactElement {
    return (
        <Flex direction="column" align="start" gap={1}>
            {!user.isAdmin && !user.isAcademicStaff ? (
                <Tag
                    variant="solid"
                    bgColor="bgSecondary"
                    color="textMain"
                    fontWeight="bold"
                    py={1}
                >
                    {user.isUnderGrad ? "Undergraduate" : "Graduate"} Student
                </Tag>
            ) : null}
            {user.isClubMember ? (
                <Tag
                    variant="solid"
                    bgColor="bgSecondary"
                    color="textMain"
                    fontWeight="bold"
                    py={1}
                >
                    Club Member
                </Tag>
            ) : null}
            {user.isAcademicStaff ? (
                <Tag
                    variant="solid"
                    bgColor="bgSecondary"
                    color="textMain"
                    fontWeight="bold"
                    py={1}
                >
                    Academic Staff
                </Tag>
            ) : null}
            {user.isAdmin ? (
                <Tag
                    variant="solid"
                    bgColor="bgSecondary"
                    color="textMain"
                    fontWeight="bold"
                    py={1}
                >
                    Administrator
                </Tag>
            ) : null}
            {user.email ? (
                <Tag
                    variant="solid"
                    bgColor="bgSecondary"
                    color="textMain"
                    fontWeight="bold"
                    py={1}
                >
                    {user.email}
                </Tag>
            ) : null}
        </Flex>
    );
}

function User({ user }: Props): ReactElement {
    const { user: currentUser } = useUserContext();

    const handleStartConversation = () => {
        axiosAuth.post<StartConversationRes>("message/start-conversation", { userId: user.id })
            .then((res) => {
                Router.push(`/messages/${res.data.conversationId}`);
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data.message ?? "An error occurred while starting the conversation");
            });
    };

    return (
        <Flex
            direction={{ base: "column", "600px": "row" }}
            gap={8}
            width="full"
            justify={{ base: "center", "600px": "space-between" }}
            align="center"
        >
            <HStack spacing={6}>
                <Avatar src={user.avatarURL} rounded="lg" width="100px" height="100px" />
                <Flex height="full" gap={2} direction="column" align="start">
                    <Box>
                        {user.name ? (
                            <Text fontSize="2xl" fontWeight="semibold">
                                {user.name} {user.surname}
                            </Text>
                        ) : null}
                        <Text fontSize="md" color="textMain" fontWeight="semibold">
                            @{user.username}
                        </Text>
                    </Box>
                    <Tags user={user} />
                </Flex>
            </HStack>
            {!user.settings?.allowAllDMs || user.id === currentUser?.id || !user.approved ? (
                null
            ) : (
                <Button colorScheme="accent" leftIcon={<Icon as={Chat} />} onClick={handleStartConversation}>
                    Message
                </Button>
            )}
        </Flex>
    );
}

function Posts({ user }: Props): ReactElement {
    const getKey = (pageIndex: number) => {
        return `posts/get-user-posts/${user.id}/${pageIndex}`;
    };

    const [reachedEnd, setReachedEnd] = useState(false);
    const [posts, setPosts] = useState<IPost[]>([]);

    const { data, error, mutate, isValidating, size: page, setSize: setPage } = useSWRInfinite(getKey, fetcher<GetPostsRes>, {
        revalidateOnFocus: false,
    });

    const loadMorePosts = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd) return (
            <VStack width="full" my={3}>
                <Spinner size="lg" />
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
            toast.error(error?.response?.data?.message ?? "An error occurred while fetching posts");
        }
    }, [data, error]);

    if (!isValidating && data?.[0].posts?.length === 0) return (
        <VStack width="full" textAlign="center" spacing={8}>
            <Box boxSize="250px">
                <Image
                    fit="cover"
                    src="/graphics/Something_Went_Wrong.png"
                    alt="No posts found graphic"
                />
            </Box>
            <Text fontSize="3xl" fontWeight="bold">This user has not posted yet</Text>
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
                        id: user.id,
                        name: user.name ? `${user.name} ${user.surname}` : user.username,
                        username: user.username,
                        avatarURL: user.avatarURL,
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

export default function Profile({ user }: Props): ReactElement {
    return (
        <Flex gap="10">
            <VStack spacing={10} align="start" flex="7">
                <User user={user} />
                <Posts user={user} />
            </VStack>
        </Flex>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Props>> {
    let user: IUser | null = null;

    try {
        const res = await axiosNoAuth.get<GetUserRes>(`users/get-user/${context.params?.username}`, {
            withCredentials: true,
            headers: {
                Cookie: `session=${context.req.cookies.session}`
            }
        });
        user = res.data.user ?? null;
    } catch (e) {
        if ((e as AxiosError).response?.status === 404) {
            return {
                notFound: true,
            };
        }
        console.error(e);
    }

    if (!user) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            user: user,
        },
    };
}
