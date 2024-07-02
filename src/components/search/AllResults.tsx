import { Text, Spinner, VStack, Divider, Button, Flex } from "@chakra-ui/react";
import { ReactElement, useEffect } from "react";
import toast from "react-hot-toast";
import {
  IEvent,
  IGroup,
  IJob,
  ISearchAnnouncement,
  ISearchArticle,
  ISearchUser,
  SearchResultsTabProps,
} from "src/types/interfaces";
import { SearchAllRes } from "src/types/server";
import { fetcher } from "src/utils/helpers";
import useSWR, { KeyedMutator } from "swr";
import User from "src/components/User";
import Announcement from "src/components/Announcement";
import Event from "src/components/Event";
import Job from "src/components/Job";
import Article from "src/components/Article";
import Router from "next/router";
import Group from "../Group";

interface UsersResultsProps {
  users: ISearchUser[];
}

interface AnnouncementsResultsProps {
  announcements: ISearchAnnouncement[];
  mutate: KeyedMutator<SearchAllRes>;
}

interface ArticlesResultsProps {
  articles: ISearchArticle[];
  mutate: KeyedMutator<SearchAllRes>;
}

interface EventsResultsProps {
  events: IEvent[];
  mutate: KeyedMutator<SearchAllRes>;
}

interface JobsResultsProps {
  jobs: IJob[];
  mutate: KeyedMutator<SearchAllRes>;
}

interface GroupsResultsProps {
  groups: IGroup[];
  mutate: KeyedMutator<SearchAllRes>;
}

function Users({ users }: UsersResultsProps): ReactElement {
  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Users
      </Text>
      {users.map((user) => (
        <User
          key={user.id}
          id={user.id}
          name={user.name}
          username={user.username}
          avatarURL={user.avatarURL}
          allowAllDMs={user.allowAllDMs}
        />
      ))}
      {users.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({ query: { ...Router.query, type: "users" } })
            }
          >
            Load More Users
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

function Announcements({
  announcements,
  mutate,
}: AnnouncementsResultsProps): ReactElement {
  const deleteAnnouncementCB = async () => {
    await mutate();
  };

  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Announcements
      </Text>
      {announcements.map((announcement) => (
        <Announcement
          key={announcement.id}
          id={announcement.id}
          title={announcement.title}
          description={announcement.content}
          date={announcement.publishDate}
          deleteAnnouncementCB={deleteAnnouncementCB}
        />
      ))}
      {announcements.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({
                query: { ...Router.query, type: "announcements" },
              })
            }
          >
            Load More Announcements
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

function Articles({ articles, mutate }: ArticlesResultsProps): ReactElement {
  const deleteArticleCB = async () => {
    await mutate();
  };

  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Articles
      </Text>
      {articles.map((article) => (
        <Article
          key={article.id}
          id={article.id}
          title={article.title}
          content={article.content}
          authorName={article.authorName}
          authorUsername={article.authorUsername}
          publishDate={article.publishDate}
          deleteArticleCB={deleteArticleCB}
        />
      ))}
      {articles.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({ query: { ...Router.query, type: "articles" } })
            }
          >
            Load More Articles
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

function Events({ events, mutate }: EventsResultsProps): ReactElement {
  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Events
      </Text>
      {events.map((event) => (
        <Event
          id={event.id}
          key={event.id}
          title={event.title}
          date={event.time}
          description={event.description ?? ""}
          imageURL={event.imageURL ?? ""}
          interest={event.interest}
          location={event.location}
          isInterested={event.isInterested ?? false}
          mutateEvents={mutate}
        />
      ))}
      {events.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({ query: { ...Router.query, type: "events" } })
            }
          >
            Load More Events
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

function Jobs({ jobs, mutate }: JobsResultsProps): ReactElement {
  const deleteJobCB = async () => {
    await mutate();
  };

  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Jobs
      </Text>
      {jobs.map((job) => (
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
      ))}
      {jobs.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({ query: { ...Router.query, type: "jobs" } })
            }
          >
            Load More Jobs
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

function Groups({ groups, mutate }: GroupsResultsProps): ReactElement {
  return (
    <VStack width="full" align="start">
      <Text fontSize="2xl" fontWeight="bold">
        Groups
      </Text>
      {groups.map((group) => (
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
      ))}
      {groups.length === 5 ? (
        <Flex width="full" alignItems="center" gap={2}>
          <Divider height="1px" bgColor="stroke" />
          <Button
            flexShrink="0"
            colorScheme="accent"
            px={6}
            size="sm"
            onClick={() =>
              Router.replace({ query: { ...Router.query, type: "groups" } })
            }
          >
            Load More Groups
          </Button>
          <Divider height="1px" bgColor="stroke" />
        </Flex>
      ) : null}
    </VStack>
  );
}

export default function AllResults({
  query,
}: SearchResultsTabProps): ReactElement {
  const { data, error, mutate, isValidating } = useSWR(
    `search?query=${query}&type=all&page=0`,
    fetcher<SearchAllRes>,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (error) {
      toast.error(
        error?.response?.data?.message ?? "An error occurred while searching"
      );
    }
  }, [error]);

  if (isValidating && !data)
    return (
      <VStack width="full" py={5}>
        <Spinner />
      </VStack>
    );

  if (
    (!isValidating && !data) ||
    (data?.users.length === 0 &&
      data?.announcements.length === 0 &&
      data?.articles.length === 0 &&
      data?.events.length === 0 &&
      data?.jobs.length === 0 &&
      data?.groups.length === 0)
  )
    return (
      <VStack width="full" py={5}>
        <Text fontWeight="bold" fontSize="3xl">
          No results found
        </Text>
      </VStack>
    );

  if (!data) return <></>;

  return (
    <VStack width="full" spacing={10}>
      {data.users.length !== 0 ? <Users users={data.users} /> : null}
      {data.announcements.length !== 0 ? (
        <Announcements announcements={data.announcements} mutate={mutate} />
      ) : null}
      {data.articles.length !== 0 ? (
        <Articles articles={data.articles} mutate={mutate} />
      ) : null}
      {data.events.length !== 0 ? (
        <Events events={data.events} mutate={mutate} />
      ) : null}
      {data.jobs.length !== 0 ? (
        <Jobs jobs={data.jobs} mutate={mutate} />
      ) : null}
      {data.groups.length !== 0 ? (
        <Groups groups={data.groups} mutate={mutate} />
      ) : null}
    </VStack>
  );
}
