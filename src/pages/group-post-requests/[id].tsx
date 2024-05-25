import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import Router, { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Virtuoso } from "react-virtuoso";
import { IPost } from "src/types/interfaces";
import { GenericBackendRes, GetPostRes, GetPostsRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import styles from "src/styles/Articles.module.scss";
import { Spinner } from "phosphor-react";
import RejectPostModal from "src/components/RejectPostModal";

export default function GroupPostRequests(): ReactElement {
  const router = useRouter();
  const { id } = router.query;
  const rejectPostModal = useDisclosure();
  const getPostRequests = (pageIndex: number) => {
    return `posts/get-group-post-requests/${id}/${pageIndex}`;
  };
  const {
    data,
    error,
    isValidating,
    size: page,
    setSize: setPage,
    mutate,
  } = useSWRInfinite(getPostRequests, fetcher<GetPostsRes>, {
    revalidateOnFocus: false,
  });

  const loadMorePostRequests = async () => {
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

  const onPostApprovalStatusUpdate = async (
    postId: string,
    status: boolean
  ) => {
    axiosAuth
      .patch<GenericBackendRes>(`posts/${postId}/status`, {
        approved: status,
      })
      .then(async (res) => {
        toast.success(res.data.message);
        await mutate();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while updating status of the post"
        );
      });
  };

  const [reachedEnd, setReachedEnd] = useState(false);
  const [postRequests, setPostRequests] = useState<IPost[]>([]);

  useEffect(() => {
    if (data) {
      setPostRequests(
        data.reduce((prev, curr) => curr.posts.concat(prev), [] as IPost[])
      );

      if (data[data.length - 1].posts.length < 25) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        (error as AxiosError<GenericBackendRes>).response?.data.message ??
          "An error occurred while fetching posts"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.posts.length === 0)
    return (
      <VStack width="full" spacing={4} textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/Deleted.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          No pending posts at the moment
        </Text>
      </VStack>
    );
  return (
    <Flex gap="10">
      <VStack spacing={4} align="start" flex="7">
        <Button onClick={() => Router.back()}>Back</Button>
        <Text fontSize="xl" fontWeight="semibold">
          Post Requests
        </Text>
        <Virtuoso
          className={styles.articles}
          data={postRequests}
          totalCount={postRequests.length}
          endReached={loadMorePostRequests}
          useWindowScroll
          components={{
            Footer,
          }}
          itemContent={(_, post) => (
            <Flex
              position="relative"
              rounded="4px"
              overflow="hidden"
              direction="column"
              gap={6}
              p={5}
              pb={4}
              align="start"
              width="full"
              color="gray.100"
            >
              <Box
                position="absolute"
                zIndex={-1}
                top={0}
                right={0}
                width="full"
                height="full"
                bgColor="rgb(0, 0, 0)"
              />
              <HStack width="full" justify="space-between" align="flex-end">
                <VStack align="start">
                  <Text fontWeight="semibold" noOfLines={1} fontSize="18px">
                    Author: {post.author?.name}
                  </Text>
                  <Text fontWeight="" fontSize="14px">
                    {post.content}
                  </Text>
                </VStack>
                <div>
                  <Button
                    style={{ marginRight: "10px" }}
                    size="sm"
                    colorScheme="button"
                    color={"black"}
                    onClick={() => onPostApprovalStatusUpdate(post.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="button"
                    color={"black"}
                    onClick={rejectPostModal.onOpen}
                  >
                    Reject
                  </Button>
                </div>
              </HStack>
              <RejectPostModal
                isOpen={rejectPostModal.isOpen}
                onClose={rejectPostModal.onClose}
                mutate={mutate}
                postId={post.id}
              />
              <Spacer />
            </Flex>
          )}
        />
      </VStack>
    </Flex>
  );
}
