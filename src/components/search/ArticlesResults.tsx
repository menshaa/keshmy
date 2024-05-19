import { Spinner, Text, VStack, } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ISearchArticle, SearchResultsTabProps } from "src/types/interfaces";
import { SearchArticlesRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import useSWRInfinite from "swr/infinite";
import Article from "src/components/Article";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/SearchResults.module.scss";

export default function ArticlesResults({ query }: SearchResultsTabProps): ReactElement {
    const [results, setResults] = useState<ISearchArticle[]>([]);
    const [reachedEnd, setReachedEnd] = useState(false);

    const getKey = (pageIndex: number) => {
        return `search?query=${query}&type=article&page=${pageIndex}`;
    };

    const { data, error, isValidating, size: page, setSize: setPage } = useSWRInfinite(getKey, fetcher<SearchArticlesRes>, {
        revalidateOnFocus: false,
    });

    const loadMoreArticles = async () => {
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
            setResults(data.reduce((prev, curr) => curr.articles.concat(prev), [] as ISearchArticle[]));

            if (data[data.length - 1].articles.length < 20) {
                setReachedEnd(true);
            }
        }

        if (error) {
            toast.error(error?.response?.data?.message ?? "An error occurred while searching");
        }
    }, [data, error]);
    
    if (!isValidating && data?.[0]?.articles.length === 0) return (
        <VStack width="full" py={5}>
            <Text fontWeight="bold" fontSize="3xl">No results found</Text>
        </VStack>
    );

    return (
        <Virtuoso
            className={styles.results}
            data={results}
            totalCount={results.length}
            endReached={loadMoreArticles}
            useWindowScroll
            components={{
                Footer: () => <Footer />
            }}
            itemContent={(_, article) => (
                <Article
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    content={article.content}
                    authorName={article.authorName}
                    authorUsername={article.authorUsername}
                    publishDate={article.publishDate}
                    deleteArticleCB={null}
                />
            )}
        />
    );
}
