import { Spinner, VStack, Text } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ISearchAnnouncement, SearchResultsTabProps } from "src/types/interfaces";
import { SearchAnnouncementsRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import Announcement from "src/components/Announcement";
import styles from "src/styles/SearchResults.module.scss";
import { Virtuoso } from "react-virtuoso";

export default function AnnouncementsResults({ query }: SearchResultsTabProps): ReactElement {
    const [results, setResults] = useState<ISearchAnnouncement[]>([]);
    const [reachedEnd, setReachedEnd] = useState(false);

    const getKey = (pageIndex: number) => {
        return `search?query=${query}&type=announcement&page=${pageIndex}`;
    };

    const { data, error, isValidating, mutate, size: page, setSize: setPage } = useSWRInfinite(getKey, fetcher<SearchAnnouncementsRes>, {
        revalidateOnFocus: false,
    });

    const loadMoreAnnouncements = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const deleteAnnouncementCB = async () => {
        await mutate();
    };

    const Footer = (): ReactElement | null => {
        if (!reachedEnd) return (
            <VStack width="full" py={5}>
                <Spinner />
            </VStack>
        );

        return null;
    };

    useEffect(() => {
        if (data) {
            setResults(data.reduce((prev, curr) => curr.announcements.concat(prev), [] as ISearchAnnouncement[]));

            if (data[data.length - 1].announcements.length < 20) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error?.response?.data?.message ?? "An error occurred while searching");
        }
    }, [data, error]);
    
    if (!isValidating && data?.[0]?.announcements.length === 0) return (
        <VStack width="full" py={5}>
            <Text fontWeight="bold" fontSize="3xl">No results found</Text>
        </VStack>
    );

    return (
        <Virtuoso
            className={styles.results}
            data={results}
            totalCount={results.length}
            endReached={loadMoreAnnouncements}
            useWindowScroll
            components={{
                Footer: () => <Footer />
            }}
            itemContent={(_, announcement) => (
                <Announcement
                    key={announcement.id}
                    id={announcement.id}
                    title={announcement.title}
                    date={announcement.publishDate}
                    description={announcement.content}
                    deleteAnnouncementCB={deleteAnnouncementCB}
                />
            )}
        />
    );
}
