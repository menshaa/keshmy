import { Divider, Flex, Text, VStack, Link } from "@chakra-ui/react";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { ReactElement } from "react";
import { IArticle } from "src/types/interfaces";
import NextLink from "next/link";
import CreationDate from "src/components/dashboard/creationDate";
import { axiosNoAuth } from "src/utils/axios";
import { GetArticleRes } from "src/types/server";
import { AxiosError } from "axios";

interface Props {
    article: IArticle;
}

export default function FullArticle(props: Props): ReactElement {
    return (
        <Flex gap="10">
            <VStack spacing={6} align="start" flex="7">
                <VStack width="full" align="start" spacing={1}>
                    <Text fontWeight="semibold" fontSize="22px">{props.article.title}</Text>
                    <Divider height="1px" bgColor="bgSecondary" />
                    <Text color="textSecondary" fontSize="16px">By:{" "}
                        <NextLink href={`/@${props.article.authorUsername}`} passHref>
                            <Link>
                                {props.article.authorName}
                            </Link>
                        </NextLink>
                        {" "}
                        · Publish Date: <CreationDate date={props.article.publishDate ?? ""} /></Text>
                </VStack>
                <Text color="textMain" whiteSpace="pre-wrap" wordBreak="break-word" lineHeight="1.8">{props.article.content}</Text>
            </VStack>
        </Flex>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Props>> {
    let article: IArticle | null = null;

    try {
        const res = await axiosNoAuth.get<GetArticleRes>(`articles/get-article/${context.params?.id}`, {
            withCredentials: true,
            headers: {
                Cookie: `session=${context.req.cookies.session}`
            }
        });
        article = res.data.article ?? null;
    } catch (e) {
        if ((e as AxiosError).response?.status === 404) {
            return {
                notFound: true,
            };
        }
        console.error(e);
    }

    if (!article) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            article: article,
        },
    };
}
