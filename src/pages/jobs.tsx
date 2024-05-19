import { Flex, Image, VStack, Text, Select, Wrap, Button, Divider, useDisclosure, Spinner } from "@chakra-ui/react";
import { ChangeEvent, ChangeEventHandler, PropsWithChildren, ReactElement, useEffect, useState } from "react";
import Job from "src/components/Job";
import { useUserContext } from "src/contexts/userContext";
import AddJobModal from "src/components/AddJobModal";
import { fetcher } from "src/utils/helpers";
import { IJob } from "src/types/interfaces";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { GenericBackendRes, GetJobsRes } from "src/types/server";
import { VirtuosoGrid } from "react-virtuoso";
import styles from "src/styles/Jobs.module.scss";
import { useRouter } from "next/router";

interface FilterProps {
    placeholder: string;
    onChange: ChangeEventHandler<HTMLSelectElement>;
}

function Filter({ children, placeholder, onChange }: PropsWithChildren<FilterProps>): ReactElement {
    return (
        <Select
            variant="solid"
            bgColor="bgThird"
            color="white"
            size="sm"
            rounded="lg"
            width="max-content"
            height={7}
            placeholder={placeholder}
            onChange={onChange}
        >
            {children}
        </Select>
    );
}

interface FiltersProps {
    handleTypeChange: ChangeEventHandler;
    handleLocationChange: ChangeEventHandler;
    activeType: string;
    activeLocation: string;
}

function Filters({ handleTypeChange, handleLocationChange, activeType, activeLocation }: FiltersProps): ReactElement {
    return (
        <Wrap spacingX={4}>
            <Filter onChange={handleTypeChange} placeholder="Job Type">
                <option selected={activeType === "FullTime"} value="FullTime">Full Time</option>
                <option selected={activeType === "PartTime"} value="PartTime">Part Time</option>
                <option selected={activeType === "Contract"} value="Contract">Contract</option>
                <option selected={activeType === "Internship"} value="Internship">Internship</option>
            </Filter>
            <Filter onChange={handleLocationChange} placeholder="Is Remote">
                <option selected={activeLocation === "Remote"} value="Remote">Remote</option>
                <option selected={activeLocation === "NotRemote"} value="NotRemote">Not Remote</option>
            </Filter>
        </Wrap>
    );
}

interface JobsBodyProps {
    swr: SWRInfiniteResponse<GetJobsRes, AxiosError<GenericBackendRes>>;
}

function JobsBody({ swr }: JobsBodyProps): ReactElement {
    const [reachedEnd, setReachedEnd] = useState(false);
    const [jobs, setJobs] = useState<IJob[]>([]);

    const { data, error, isValidating, mutate, size: page, setSize: setPage } = swr;

    const loadMoreJobs = async () => {
        if (reachedEnd) {
            return;
        }

        await setPage(page + 1);
    };

    const deleteJobCB = async () => {
        await mutate();
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
            setJobs(data.reduce((prev, curr) => curr.jobs.concat(prev), [] as IJob[]));

            if (data[data.length - 1].jobs.length < 30) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error.response?.data.message ?? "An error occurred while fetching jobs");
        }
    }, [data, error]);

    if (!isValidating && data?.[0]?.jobs.length === 0) return (
        <VStack width="full" spacing={4} textAlign="center">
            <Image
                fit="cover"
                width="250px"
                src="/graphics/Deleted.png"
                alt="List is empty graphic"
            />
            <Text fontSize="3xl" fontWeight="bold">No jobs are available at this time</Text>
        </VStack>
    );

    return (
        <VirtuosoGrid
            className={styles.jobs}
            data={jobs}
            totalCount={jobs.length}
            endReached={loadMoreJobs}
            useWindowScroll
            overscan={200}
            components={{
                Footer,
            }}
            itemContent={(_, job) => (
                <Job
                    key={job.id}
                    id={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    type={job.type}
                    pay={job.salary}
                    description={job.description}
                    datePosted={job.createdAt}
                    link={job.link}
                    deleteJobCB={deleteJobCB}
                />
            )}
        />
    );
}


export default function Jobs(): ReactElement {
    const { user } = useUserContext();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const router = useRouter();

    const getKey = (pageIndex: number) => {
        const filters = `?type=${router.query.type ?? ""}&location=${router.query.location ?? ""}`;
        return `jobs/get-jobs/${pageIndex}${filters}`;
    };

    const swr = useSWRInfinite<GetJobsRes, AxiosError<GenericBackendRes>>(getKey, fetcher<GetJobsRes>, {
        revalidateOnFocus: false,
    });

    const handleTypeChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        router.replace(`/jobs?type=${e.target.value}&location=${router.query.location ?? ""}`);
    };

    const handleLocationChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        router.replace(`/jobs?type=${router.query.type ?? ""}&location=${e.target.value}`);
    };

    return (
        <Flex>
            <VStack spacing={4} align="start" flex="7">
                {user?.isAdmin ? (
                    <VStack width="full" align="start" spacing={5}>
                        <VStack width="full" align="start" spacing={5}>
                            <Text fontSize="18px" fontWeight="semibold">Looking to add a job? Click the button below</Text>
                            <Button colorScheme="button" size="sm" px={8} onClick={onOpen}>Post a Job</Button>
                        </VStack>
                        <Divider height="1px" bgColor="bgSecondary" />
                        <AddJobModal isOpen={isOpen} onClose={onClose} mutate={swr.mutate} />
                    </VStack>
                ) : null}
                <Text fontSize="xl" mb={1} fontWeight="semibold">
                    Jobs
                </Text>
                <Filters
                    handleTypeChange={handleTypeChange}
                    handleLocationChange={handleLocationChange}
                    activeType={router.query.type as string | undefined ?? ""}
                    activeLocation={router.query.location as string | undefined ?? ""}
                />
                <JobsBody swr={swr} />
            </VStack>
        </Flex>
    );
}
