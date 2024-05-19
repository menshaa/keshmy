import { Spinner, VStack, Text } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IJob, SearchResultsTabProps } from "src/types/interfaces";
import { SearchJobsRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import Job from "src/components/Job";
import useSWRInfinite from "swr/infinite";
import styles from "src/styles/SearchResults.module.scss";
import { Virtuoso } from "react-virtuoso";

export default function JobsResults({ query }: SearchResultsTabProps): ReactElement {
    const [results, setResults] = useState<IJob[]>([]);
    const [reachedEnd, setReachedEnd] = useState(false);

    const getKey = (pageIndex: number) => {
        return `search?query=${query}&type=job&page=${pageIndex}`;
    };

    const { data, error, isValidating, size: page, setSize: setPage } = useSWRInfinite(getKey, fetcher<SearchJobsRes>, {
        revalidateOnFocus: false,
    });

    const loadMoreJobs = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
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
            setResults(data.reduce((prev, curr) => curr.jobs.concat(prev), [] as IJob[]));

            if (data[data.length - 1].jobs.length < 20) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error?.response?.data?.message ?? "An error occurred while searching");
        }
    }, [data, error]);
    
    if (!isValidating && data?.[0]?.jobs.length === 0) return (
        <VStack width="full" py={5}>
            <Text fontWeight="bold" fontSize="3xl">No results found</Text>
        </VStack>
    );

    return (
        <Virtuoso
            className={styles.results}
            data={results}
            totalCount={results.length}
            endReached={loadMoreJobs}
            useWindowScroll
            components={{
                Footer: () => <Footer />
            }}
            itemContent={(_, job) => (
                <Job
                    id={job.id}
                    key={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    type={job.type}
                    pay={job.salary}
                    description={job.description}
                    datePosted={job.createdAt}
                    link={job.link}
                    deleteJobCB={null}
                />
            )}
        />
    );
}
