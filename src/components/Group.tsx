import {
  Box,
  Flex,
  Text,
  Spacer,
  HStack,
  VStack,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import Router from "next/router";

import RejectGroupModal from "src/components/RejectGroupModal";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import { GenericBackendRes, GetMyGroupsRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";
import { KeyedMutator } from "swr";
import { IUser } from "src/types/interfaces";

interface GrouptProps {
  id: string;
  name: string;
  description: string;
  displayJoinButton: boolean;
  isJoinedInitial: boolean;
  approved: boolean;
  pending: boolean;
  mutate?: KeyedMutator<GetMyGroupsRes[]>;
  creator?: IUser | null;
}

export default function Group({
  id,
  name,
  description,
  displayJoinButton,
  isJoinedInitial,
  approved,
  pending,
  mutate,
  creator,
}: GrouptProps): ReactElement {
  const [isJoined, setIsJoined] = useState(isJoinedInitial);
  const boxBgColor = approved ? "rgb(0, 0, 0)" : "rgb(112,112,112)";
  const rejectGroupModel = useDisclosure();

  const onJoinGroup = (id: string) => {
    if (!approved || isJoined) {
      return;
    }
    axiosAuth
      .post<GenericBackendRes>(`groups/${id}/join-group`)
      .then(async (res) => {
        toast.success(res.data.message);
        setIsJoined(true);

        // TODO: Try using mutate
        // await mutate();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
      });
  };
  const onGroupApprovalStatusUpdate = (groupId: string, status: boolean) => {
    axiosAuth
      .patch<GenericBackendRes>(`groups/${groupId}/request`, {
        approved: status,
      })
      .then(async (res) => {
        toast.success(res.data.message);
        if (mutate) {
          await mutate();
        }
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
      });
  };
  return (
    <Flex
      position="relative"
      rounded="4px"
      overflow="hidden"
      direction="column"
      gap={6}
      p={5}
      pb={4}
      align="start"
      width="full"
      color="gray.100"
    >
      <Box
        position="absolute"
        zIndex={-1}
        top={0}
        right={0}
        width="full"
        height="full"
        bgColor={boxBgColor}
      />
      <HStack
        width="full"
        justify="space-between"
        align="flex-end"
        onClick={() => {
          if (!approved || !isJoined) {
            return;
          }
          Router.push(`/view-group/${id}`);
        }}
      >
        <VStack align="start">
          <Text fontWeight="semibold" noOfLines={1} fontSize="18px">
            {name}
            <span style={{ paddingLeft: "10px", fontSize: "13px" }}>
              {approved === null ? "(Pending Approval)" : ""}
              {approved === false ? "(Rejected)" : ""}
            </span>
          </Text>
          <Text fontWeight="" fontSize="14px">
            {description}
          </Text>
          {creator ? (
            <Text fontWeight="" fontSize="12px">
              <b>Creator: </b> {creator.name} {creator.surname}
            </Text>
          ) : null}
        </VStack>
        {displayJoinButton ? (
          <Button
            size="sm"
            colorScheme="button"
            disabled={isJoined}
            color={"black"}
            backgroundColor={isJoined ? "grey" : "white"}
            onClick={() => onJoinGroup(id)}
          >
            {isJoined ? "Joined" : "Join"}
          </Button>
        ) : null}
        {pending ? (
          <div>
            <Button
              style={{ marginRight: "10px" }}
              size="sm"
              colorScheme="button"
              color={"black"}
              onClick={() => onGroupApprovalStatusUpdate(id, true)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              colorScheme="button"
              color={"black"}
              onClick={rejectGroupModel.onOpen}
            >
              Reject
            </Button>
          </div>
        ) : null}
        <RejectGroupModal
          isOpen={rejectGroupModel.isOpen}
          onClose={rejectGroupModel.onClose}
          mutate={mutate}
          groupId={id}
        />
      </HStack>
      <Spacer />
    </Flex>
  );
}
