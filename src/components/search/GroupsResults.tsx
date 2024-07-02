import { Spinner, VStack, Text } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IGroup, SearchResultsTabProps } from "src/types/interfaces";
import { SearchGroupsRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import Group from "src/components/Group";
import styles from "src/styles/SearchResults.module.scss";
import { Virtuoso } from "react-virtuoso";

export default function GroupsResults({
  query,
}: SearchResultsTabProps): ReactElement {
  const [results, setResults] = useState<IGroup[]>([]);
  const [reachedEnd, setReachedEnd] = useState(false);

  const getKey = (pageIndex: number) => {
    return `search?query=${query}&type=group&page=${pageIndex}`;
  };

  const {
    data,
    error,
    isValidating,
    mutate,
    size: page,
    setSize: setPage,
  } = useSWRInfinite(getKey, fetcher<SearchGroupsRes>, {
    revalidateOnFocus: false,
  });

  const loadMoreGroups = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
  };

  const Footer = (): ReactElement | null => {
    if (!reachedEnd)
      return (
        <VStack width="full" py={5}>
          <Spinner />
        </VStack>
      );

    return null;
  };

  useEffect(() => {
    if (data) {
      setResults(
        data.reduce((prev, curr) => curr.groups.concat(prev), [] as IGroup[])
      );

      if (data[data.length - 1].groups.length < 20) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        error?.response?.data?.message ?? "An error occurred while searching"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.groups.length === 0)
    return (
      <VStack width="full" py={5}>
        <Text fontWeight="bold" fontSize="3xl">
          No results found
        </Text>
      </VStack>
    );

  return (
    <Virtuoso
      className={styles.results}
      data={results}
      totalCount={results.length}
      endReached={loadMoreGroups}
      useWindowScroll
      components={{
        Footer: () => <Footer />,
      }}
      itemContent={(_, group) => (
        <Group
          id={group.id}
          key={group.id}
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
