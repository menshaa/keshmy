import {
  Flex,
  VStack,
  Text,
  Image,
  useDisclosure,
  Divider,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Article from "src/components/Article";
import { useUserContext } from "src/contexts/userContext";
import AddArticleModal from "src/components/AddArticleModal";
import { GenericBackendRes, GetArticlesRes } from "src/types/server";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { IArticle } from "src/types/interfaces";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { Virtuoso } from "react-virtuoso";
import styles from "src/styles/Articles.module.scss";

const getKey = (pageIndex: number) => {
  return `articles/get-articles?page=${pageIndex}`;
};

function ArticlesBody(): ReactElement {
  const {
    data,
    error,
    isValidating,
    mutate,
    size: page,
    setSize: setPage,
  } = useSWRInfinite<GetArticlesRes, AxiosError<GenericBackendRes>>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const [reachedEnd, setReachedEnd] = useState(false);
  const [articles, setArticles] = useState<IArticle[]>([]);

  const loadMoreArticles = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
  };

  const deleteArticleCB = async () => {
    await mutate();
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
      setArticles(
        data.reduce(
          (prev, curr) => curr.articles.concat(prev),
          [] as IArticle[]
        )
      );

      if (data[data.length - 1].articles.length < 25) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        error.response?.data.message ??
          "An error occurred while fetching articles"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.articles.length === 0)
    return (
      <VStack width="full" spacing={4} textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/Deleted.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          No articles are available at this time
        </Text>
      </VStack>
    );

  return (
    <Virtuoso
      className={styles.articles}
      data={articles}
      totalCount={articles.length}
      endReached={loadMoreArticles}
      useWindowScroll
      components={{
        Footer,
      }}
      itemContent={(_, article) => (
        <Article
          key={article.id}
          id={article.id}
          title={article.title}
          authorName={article.authorName}
          authorUsername={article.authorUsername}
          content={article.content ?? ""}
          publishDate={article.publishDate ?? ""}
          deleteArticleCB={deleteArticleCB}
          mutate={mutate}
        />
      )}
    />
  );
}

export default function Articles(): ReactElement {
  const { user } = useUserContext();

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex>
      <VStack align="start" width="full">
        {user?.isAdmin || user?.isAcademicStaff ? (
          <VStack width="full" align="start" spacing={5}>
            <VStack width="full" align="start" spacing={5}>
              <Text fontSize="18px" fontWeight="semibold">
                Looking to publish a new article? Click the button below
              </Text>
              <Button colorScheme="button" size="sm" px={8} onClick={onOpen}>
                Publish Article
              </Button>
            </VStack>
            <Divider height="1px" bgColor="bgSecondary" />
            <AddArticleModal isOpen={isOpen} onClose={onClose} />
          </VStack>
        ) : null}
        <Text fontSize="xl" fontWeight="semibold">
          Articles
        </Text>
        <ArticlesBody />
      </VStack>
    </Flex>
  );
}
