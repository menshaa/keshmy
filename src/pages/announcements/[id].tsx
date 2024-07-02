import { Divider, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { ReactElement } from "react";
import { IAnnouncement } from "src/types/interfaces";
import { AxiosError } from "axios";
import { axiosNoAuth } from "src/utils/axios";
import { GetAnnouncementRes } from "src/types/server";
import CreationDate from "src/components/dashboard/creationDate";

interface Props {
  announcement: IAnnouncement;
}

export default function FullAnnouncement(props: Props): ReactElement {
  return (
    <Flex gap="10">
      <VStack spacing={6} align="start" flex="7">
        <VStack width="full" align="start" spacing={1}>
          <Flex
            direction="column"
            width="full"
            maxWidth={{ base: "100%", md: "60%" }}
          >
            <Image
              fit="cover"
              rounded="sm"
              src={props.announcement.imageURL}
              alt={props.announcement.title}
            />
          </Flex>
          <Text fontWeight="semibold" fontSize="22px">
            {props.announcement.title}
          </Text>
          <Divider height="1px" bgColor="bgSecondary" />
          <Text color="bgSecondary" fontSize="16px">
            Date: <CreationDate date={props.announcement.createdAt} />
          </Text>
        </VStack>
        <Text
          color="textMain"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
          lineHeight="1.8"
        >
          {props.announcement.content}
        </Text>
      </VStack>
    </Flex>
  );
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<Props>> {
  let announcement: IAnnouncement | null = null;

  try {
    const res = await axiosNoAuth.get<GetAnnouncementRes>(
      `announcements/get-announcement/${context.params?.id}`,
      {
        withCredentials: true,
        headers: {
          Cookie: `session=${context.req.cookies.session}`,
        },
      }
    );
    announcement = res.data.announcement ?? null;
  } catch (e) {
    if ((e as AxiosError).response?.status === 404) {
      return {
        notFound: true,
      };
    }
    console.error(e);
  }

  if (!announcement) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      announcement,
    },
  };
}
