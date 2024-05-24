import {
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  Button,
  HStack,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import Input from "src/components/Input";

import Textarea from "src/components/Textarea";

import "react-datepicker/dist/react-datepicker.css";

import toast from "react-hot-toast";
import { axiosAuth } from "src/utils/axios";
import {
  GenericBackendRes,
  GetClubMembersRes,
  GetMyGroupsRes,
} from "src/types/server";
import { AxiosError } from "axios";

import { KeyedMutator } from "swr";
import Router from "next/router";

interface AddGroupAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | string[] | undefined;
  groupId: string | string[] | undefined | null;
  name: string;
  username: string;
  isGroupAdmin: boolean | undefined;
  loggedInUserId: string | undefined;
  isLoggedInUserGroupAdmin: boolean;
  mutate: KeyedMutator<GetClubMembersRes[]>;
}

export default function AddGroupAdminModal({
  isOpen,
  onClose,
  userId,
  groupId,
  name,
  username,
  isGroupAdmin,
  loggedInUserId,
  isLoggedInUserGroupAdmin,
  mutate,
}: AddGroupAdminModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);

    axiosAuth
      .patch<GenericBackendRes>(
        `groups/${groupId}/member/${userId}/admin-status`,
        {
          isAdmin: !isGroupAdmin,
        }
      )
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        if (mutate) {
          await mutate();
        }
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
        setSubmitting(false);
      });
  };

  useEffect(() => {}, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>
            Member - {name} (@{username})
          </Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <HStack
            width="full"
            justify="center"
            spacing={5}
            style={{ paddingBottom: "30px" }}
          >
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Submitting"
              onClick={() => Router.push(`/@${username}`)}
            >
              View User
            </Button>
            {loggedInUserId !== userId && isLoggedInUserGroupAdmin ? (
              <Button
                colorScheme="green"
                isLoading={isSubmitting}
                loadingText="Submitting"
                onClick={handleSubmit}
              >
                {!isGroupAdmin ? "Make Admin" : "Remove Admin"}
              </Button>
            ) : null}
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
