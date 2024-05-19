import {
    VStack,
    Text,
    TableContainer,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    ButtonGroup,
    Button,
    useDisclosure,
    Spinner,
    Link,
    HStack,
} from "@chakra-ui/react";
import { CheckSquare, XSquare } from "phosphor-react";
import { ReactElement, useEffect, useState } from "react";
import CheckBox from "src/components/Checkbox";
import { Dialog } from "src/components/Dialog";
import { AdminArticlesRes } from "src/types/server";
import { IDashboardArticle } from "src/types/interfaces";
import { axiosAuth } from "src/utils/axios";
import toast from "react-hot-toast";
import NextLink from "next/link";
import useSWR from "swr";
import CreationDate from "src/components/dashboard/creationDate";
import { fetcher } from "src/utils/helpers";

export default function Articles(): ReactElement {
    const [page, setPage] = useState(0);
    const [articleCount, setArticleCount] = useState(0);
    const [articles, setArticles] = useState<(IDashboardArticle & { selected: boolean })[]>([]);

    const { data, mutate, error, isValidating } = useSWR(`admin/get-all-articles?page=${page}`, fetcher<AdminArticlesRes>, {
        revalidateOnFocus: false,
    });

    const allChecked = articles.length ? articles.every((a) => a.selected) : false;
    const anyChecked = articles.length ? articles.some((a) => a.selected) : false;
    const isIndeterminate = anyChecked && !allChecked;
    const pages = Math.ceil(articleCount / 25);

    const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    const maxTableHeight = {
        base: "calc(100vh - var(--chakra-headerHeight-mobile) - var(--chakra-navBarHeight) - 200px)",
        md: "calc(100vh - var(--chakra-headerHeight-desktop) - 220px)"
    };

    const handleApprove = async () => {
        const ids = articles.reduce((prev, curr) => {
            if (curr.selected) prev.push(curr.id);
            return prev;
        }, [] as string[]);

        try {
            await mutate(axiosAuth.patch("admin/approve-articles", { ids }), {
                optimisticData: { articles: articles.map((a) => ids.includes(a.id) ? {...a, approved: true} : a), articleCount: articleCount },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error occurred while approving the articles");
        }
    };

    const handleDelete = async () => {
        const ids = articles.reduce((prev, curr) => {
            if (curr.selected) prev.push(curr.id);
            return prev;
        }, [] as string[]);

        try {
            await mutate(axiosAuth.patch("admin/delete-articles", { ids }), {
                optimisticData: { articles: articles.filter((a) => !ids.includes(a.id)), articleCount: articleCount - ids.length },
                populateCache: false,
                revalidate: (page === 0 && allChecked && pages > 1) || (page !== 0 && allChecked),
                rollbackOnError: true,
            });

            if (pages > 1 && allChecked) {
                setPage((page) => page === 0 ? page : page - 1);
            }
        } catch (e) {
            toast.error("An error occurred while deleting the articles");
        }
    };

    useEffect(() => {
        if (data) {
            setArticles(data.articles.map((article) => ({ ...article, selected: false })));
            setArticleCount(data.articleCount);
        }

        if (error) {
            toast.error(error?.response?.data?.message ?? "An error occurred while fetching articles");
        }
    }, [data, error]);

    return (
        <>
            <VStack align="start" width="full">
                <TableContainer width="full" border="1px solid var(--chakra-colors-bgSecondary)" maxHeight={maxTableHeight} overflowY="scroll" rounded="2px">
                    <Table
                        colorScheme="button"
                        sx={{
                            "& th": { textTransform: "none", color: "text" },
                            "& td": { textTransform: "none", fontSize: "sm" },
                            "& tr > *:nth-of-type(2)": { pl: "0px" },
                            "& tr > :first-of-type": { pl: "15px", pr: "15px" },
                        }}
                    >
                        <Thead bgColor="bgSecondary" textTransform="none" position="sticky" top="0" zIndex={1}>
                            <Tr>
                                <Th>
                                    <CheckBox
                                        isDisabled={isValidating || articles.length === 0}
                                        isChecked={allChecked}
                                        isIndeterminate={isIndeterminate}
                                        onChange={(e) =>
                                            setArticles((a) => {
                                                return a.map((box) => {
                                                    box = { ...box, selected: e.target.checked };
                                                    return box;
                                                });
                                            })
                                        }
                                    />
                                </Th>
                                <Th>Date</Th>
                                <Th>Title</Th>
                                <Th>Author</Th>
                                <Th>Approved</Th>
                            </Tr>
                        </Thead>
                        <Tbody bgColor="bgPrimary">
                            {!isValidating && pages === 0 && articles.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5}>
                                        <VStack width="full">
                                            <Text>There are no articles to manage</Text>
                                        </VStack>
                                    </Td>
                                </Tr>
                            ) : null}
                            {isValidating || (pages !== 0 && articles.length === 0) ? (
                                <Tr>
                                    <Td colSpan={5}>
                                        <VStack width="full">
                                            <Spinner />
                                        </VStack>
                                    </Td>
                                </Tr>
                            ) : null}
                            {!isValidating && articles.map((article, i) => (
                                <Tr key={article.id}>
                                    <Td>
                                        <CheckBox
                                            id={article.id}
                                            isChecked={article.selected}
                                            onChange={(e) => {
                                                setArticles((a) => {
                                                    return a.map((box, j) => {
                                                        if (j === i) box = { ...box, selected: e.target.checked };
                                                        return box;
                                                    });
                                                });
                                            }}
                                        />
                                    </Td>
                                    <Td><CreationDate date={article.createdAt} /></Td>
                                    <Td>{article.title}</Td>
                                    <Td>
                                        <NextLink href={`/@${article.author.username}`} passHref>
                                            <Link>
                                                {`${article.author.name} ${article.author.surname}`}
                                            </Link>
                                        </NextLink>
                                    </Td>
                                    <Td>
                                        {article.approved ? (
                                            <CheckSquare
                                                size="20"
                                                weight="bold"
                                                color="var(--chakra-colors-green-500)"
                                            />
                                        ) : (
                                            <XSquare
                                                size="20"
                                                weight="bold"
                                                color="var(--chakra-colors-red-600)"
                                            />
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
                <HStack width="full" align="space-between">
                    <VStack align="start" width="full" spacing={5}>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="bold">
                                {articleCount}
                            </Text>{" "}
                            Articles - {articles.filter((a) => a.selected).length} of {articles.length}{" "}
                            selected
                        </Text>
                        <ButtonGroup size="sm" isDisabled={!anyChecked}>
                            <Button rounded="8px" colorScheme="green" width="90px" height="30px" onClick={onApproveOpen}>
                                Approve
                            </Button>
                            <Button rounded="8px" colorScheme="red" width="90px" height="30px" onClick={onDeleteOpen}>
                                Delete
                            </Button>
                        </ButtonGroup>
                    </VStack>
                    <VStack width="full" align="end" justify="space-between">
                        {pages !== 0 && (<Text fontSize="sm" fontWeight="bold">Page {page + 1}/{pages}</Text>)}
                        <ButtonGroup
                            isDisabled={Boolean(articles.length)}
                            isAttached
                            colorScheme="accent"
                            size="sm"
                            variant="outline"
                        >
                            <Button
                                isDisabled={page === 0}
                                border="1px solid"
                                onClick={() => setPage((page) => page - 1)}
                            >
                                Prev
                            </Button>
                            <Button
                                isDisabled={page >= (pages - 1)}
                                border="1px solid"
                                onClick={() => setPage((page) => page + 1)}
                            >
                                Next
                            </Button>
                        </ButtonGroup>
                    </VStack>
                </HStack>
            </VStack>
            <Dialog
                isOpen={isApproveOpen}
                onClose={onApproveClose}
                header="Approve articles"
                message={`Are you sure you want to approve ${articles.filter(a => a.selected).length} article(s)?`}
                btnColor="green"
                confirmationBtnTitle="Approve"
                handleConfirmation={handleApprove}
            />
            <Dialog
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                header="Delete articles"
                message={`Are you sure you want to delete ${articles.filter(a => a.selected).length} article(s)?`}
                btnColor="red"
                confirmationBtnTitle="Delete"
                handleConfirmation={handleDelete}
            />
        </>
    );
}
