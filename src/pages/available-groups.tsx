import {
  Text,
  Flex,
  Image,
  VStack,
  useDisclosure,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Group from "src/components/Group";

import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import { IGroup } from "src/types/interfaces";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { GenericBackendRes, GetMyGroupsRes } from "src/types/server";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/Articles.module.scss";
import Router from "next/router";

const getGroups = () => {
  return "groups";
};

function GroupsBody(): ReactElement {
  const {
    data,
    error,
    isValidating,
    size: page,
    setSize: setPage,
  } = useSWRInfinite(getGroups, fetcher<GetMyGroupsRes>, {
    revalidateOnFocus: false,
  });

  const [reachedEnd, setReachedEnd] = useState(false);
  const [groups, setGroups] = useState<IGroup[]>([]);

  const loadMoreGroups = async () => {
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
      setGroups(
        data.reduce((prev, curr) => curr.groups.concat(prev), [] as IGroup[])
      );

      if (data[data.length - 1].groups.length < 25) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        (error as AxiosError<GenericBackendRes>).response?.data.message ??
          "An error occurred while fetching groups"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.groups.length === 0)
    return (
      <VStack width="full" spacing={4} textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/Deleted.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          No available groups at the moment
        </Text>
      </VStack>
    );

  return (
    <Virtuoso
      className={styles.articles}
      data={groups}
      totalCount={groups.length}
      endReached={loadMoreGroups}
      useWindowScroll
      components={{
        Footer,
      }}
      itemContent={(_, group) => (
        <Group
          key={group.id}
          id={group.id}
          name={group.name}
          description={group.description ?? ""}
          creator={group.creator ?? null}
          displayJoinButton={true}
          isJoinedInitial={group.isJoined}
          approved={group.approved}
          pending={false}
        />
      )}
    />
  );
}

export default function Groups(): ReactElement {
  return (
    <Flex gap="10">
      <VStack spacing={4} align="start" flex="7">
        <Button onClick={() => Router.back()}>Back</Button>
        <Text fontSize="xl" fontWeight="semibold">
          Available Groups
        </Text>
        <GroupsBody />
      </VStack>
    </Flex>
  );
}
