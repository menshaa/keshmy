import {
  Text,
  Image,
  Flex,
  VStack,
  Divider,
  Box,
  Spinner,
  Button,
  Link as ChakraLink,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Post from "src/components/Post";
import toast from "react-hot-toast";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { AxiosError } from "axios";
import {
  GenericBackendRes,
  GetClubMembersRes,
  GetFeedRes,
  GetGroupRes,
} from "src/types/server";
import { IClubMember, IGroup, IPost } from "src/types/interfaces";
import styles from "src/styles/userProfile.module.scss";
import groupStyles from "src/styles/Club.module.scss";
import ComposePost from "src/components/ComposePost";
import { useRouter } from "next/router";
import { axiosAuth } from "src/utils/axios";
import Avatar from "src/components/Avatar";
import AddGroupAdminModal from "src/components/AddGroupAdminModal";
import { useUserContext } from "src/contexts/userContext";
import { KeyedMutator } from "swr";

interface MemberProps {
  name: string;
  username: string;
  avatarURL: string;
  isGroupAdmin: boolean | undefined;
  groupId: string | string[] | undefined;
  userId: string;
  loggedInUserId: string | undefined;
  isLoggedInUserGroupAdmin: boolean;
  mutate: KeyedMutator<GetClubMembersRes[]>;
  isWhiteListed: boolean | undefined;
}

function Member({
  name,
  username,
  avatarURL,
  isGroupAdmin,
  groupId,
  userId,
  loggedInUserId,
  isLoggedInUserGroupAdmin,
  mutate,
  isWhiteListed,
}: MemberProps): ReactElement {
  const addGroupAdminModal = useDisclosure();
  return (
    <div onClick={addGroupAdminModal.onOpen}>
      <ChakraLink>
        <VStack width="full">
          <Avatar src={avatarURL} rounded="lg" width="90px" height="90px" />
          <Text
            fontWeight={loggedInUserId === userId ? "bold" : ""}
            color={loggedInUserId === userId ? "grey" : ""}
          >
            {name} {isGroupAdmin ? "(Admin)" : ""}
          </Text>
        </VStack>
      </ChakraLink>
      <AddGroupAdminModal
        isOpen={addGroupAdminModal.isOpen}
        onClose={addGroupAdminModal.onClose}
        groupId={groupId}
        userId={userId}
        loggedInUserId={loggedInUserId}
        name={name}
        username={username}
        isGroupAdmin={isGroupAdmin}
        isLoggedInUserGroupAdmin={isLoggedInUserGroupAdmin}
        mutate={mutate}
        isWhiteListed={isWhiteListed}
      />
    </div>
  );
}

function Members({
  groupId,
  loggedInUserId,
}: {
  groupId: string | string[] | undefined;
  loggedInUserId: string | undefined;
}): ReactElement {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [members, setMembers] = useState<IClubMember[]>([]);
  const [isLoggedInUserGroupAdmin, setIsLoggedInUserGroupAdmin] =
    useState(false);

  const getMembersKey = (pageIndex: number = 1) => {
    return `groups/${groupId}/members?page=${pageIndex}`;
  };

  const {
    data,
    error,
    isValidating,
    size: page,
    setSize: setPage,
    mutate,
  } = useSWRInfinite<GetClubMembersRes, AxiosError<GenericBackendRes>>(
    getMembersKey,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const loadMoreMembers = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
  };

  const Footer = (): ReactElement | null => {
    if (!reachedEnd)
      return (
        <VStack width="full">
          <Spinner />
        </VStack>
      );

    return null;
  };

  useEffect(() => {
    if (data) {
      setMembers(
        data.reduce(
          (prev, curr) => curr.members.concat(prev),
          [] as IClubMember[]
        )
      );

      if (data[data.length - 1].members.length < 15) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        error.response?.data.message ??
          "An error occurred while fetching members"
      );
    }
  }, [data, error]);

  useEffect(() => {
    if (members && members.length) {
      setIsLoggedInUserGroupAdmin(
        !!members.find(
          (member) => member.id === loggedInUserId && member.isGroupAdmin
        )
      );
    }
  }, [members]);

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
            <Text fontSize="2xl" fontWeight="bold">
              No members in the group
            </Text>
          </VStack>
        ) : (
          <VirtuosoGrid
            className={groupStyles.members}
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
                userId={member.id}
                groupId={groupId}
                avatarURL={member.avatarURL ?? ""}
                isGroupAdmin={member.isGroupAdmin}
                loggedInUserId={loggedInUserId}
                isLoggedInUserGroupAdmin={isLoggedInUserGroupAdmin}
                mutate={mutate}
                isWhiteListed={member.isWhiteListed}
              />
            )}
          />
        )}
      </VStack>
    </VStack>
  );
}

interface PostsProps {
  swr: SWRInfiniteResponse<GetFeedRes, AxiosError<GenericBackendRes>>;
}

function Posts({ swr }: PostsProps): ReactElement {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [posts, setPosts] = useState<IPost[]>([]);

  const {
    data,
    error,
    mutate,
    isValidating,
    size: page,
    setSize: setPage,
  } = swr;

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
      setPosts(
        data.reduce((prev, curr) => prev.concat(curr.posts), [] as IPost[])
      );

      if (data[data.length - 1].posts.length < 30) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        error.response?.data.message ??
          "An error occurred while fetching the posts"
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
  const { user: loggedInUser } = useUserContext();
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState<IGroup | null>(null);
  const [groupAdmins, setGroupAdmins] = useState<string[]>([]);
  const getPosts = (pageIndex: number) => {
    return `posts/get-all-posts/${pageIndex}?groupId=${id}`;
  };

  const onLeaveGroup = (id: string) => {
    axiosAuth
      .post<GenericBackendRes>(`groups/${id}/leave-group`)
      .then(async (res) => {
        toast.success(res.data.message);
        router.back();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
      });
  };

  const createPostRoute = `posts/create-post?groupId=${id}`;
  const swr = useSWRInfinite<GetFeedRes, AxiosError<GenericBackendRes>>(
    getPosts,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (id) {
      axiosAuth
        .get<GetGroupRes>(`groups/${id}`)
        .then((res) => {
          setGroup(res.data.data.group);
          setGroupAdmins(res.data.data.admins);
        })
        .catch((error) => {
          toast.error(
            (error as AxiosError<GenericBackendRes>).response?.data.message ??
              "An error occurred while fetching group"
          );
        });
    }
  }, [id]);

  return (
    <Flex gap="10">
      <VStack spacing={4} align="start" flex="7">
        <HStack>
          <Button onClick={() => router.back()}>Back</Button>
          <Button color="red" onClick={() => onLeaveGroup(id)}>
            Leave
          </Button>
          {groupAdmins.includes(loggedInUser?.id) ? (
            <Button onClick={() => router.push(`/group-post-requests/${id}`)}>
              Post Requests
            </Button>
          ) : null}
        </HStack>

        <Text fontSize="xl" fontWeight="semibold">
          Group Name: {group?.name}
        </Text>
        <Text fontSize="sm">Description: {group?.description}</Text>
        <Text fontSize="sm">
          Creator: {group?.creator?.name} {group?.creator?.surname}
        </Text>
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
      <Members groupId={id} loggedInUserId={loggedInUser?.id} />
    </Flex>
  );
}
