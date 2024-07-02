import {
  Box,
  HStack,
  VStack,
  Text,
  MenuList,
  MenuItem,
  Tag,
  TagLeftIcon,
  TagLabel,
  Button,
  Wrap,
  Link as ChakraLink,
  useDisclosure,
  Icon,
} from "@chakra-ui/react";
import { Briefcase, Money } from "phosphor-react";
import { ReactElement } from "react";
import OptionsMenu from "src/components/Options";
import NextLink from "next/link";
import { TrashIcon, PencilIcon } from "@heroicons/react/solid";
import { Dialog } from "src/components/Dialog";
import { AxiosError } from "axios";
import { GenericBackendRes } from "src/types/server";
import toast from "react-hot-toast";
import { axiosAuth } from "src/utils/axios";
import { useUserContext } from "src/contexts/userContext";
import AddJobModal from "./AddJobModal";
import EditJobModal from "./EditJobModal";

interface JobProps {
  id: string;
  title: string;
  company: string;
  location?: string;
  type?: string;
  pay: number[];
  description: string;
  datePosted: string;
  link: string;
  deleteJobCB: (() => Promise<void>) | null;
  mutate?: any;
}

interface JobType {
  [str: string]: string;
}

const jobType: JobType = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Contract: "Contract",
  Internship: "Internship",
};

interface RelativeTimeProps {
  date: string;
}

function RelativeTime({ date }: RelativeTimeProps): ReactElement {
  const now = new Date();
  const datePosted = new Date(date);
  const difference = now.getTime() - datePosted.getTime();

  if (difference > 1000 * 60 * 60 * 24 * 90) {
    // date is older than 3 months
    return (
      <Text color="textSecondary" fontSize="xs">
        Posted on{" "}
        <Text as="span" fontWeight="bold">
          {datePosted.toLocaleString("default", {
            day: "2-digit",
          })}
          /
          {datePosted.toLocaleString("default", {
            month: "2-digit",
          })}
          /{datePosted.getFullYear()}
        </Text>
      </Text>
    );
  } else if (difference >= 1000 * 60 * 60 * 24 * 30) {
    // date is older than 1 month
    return (
      <Text color="textSecondary" fontSize="xs">
        Posted{" "}
        <Text as="span" fontWeight="bold">
          {Math.floor(difference / (1000 * 60 * 60 * 24 * 30))} Month(s)
        </Text>{" "}
        ago
      </Text>
    );
  } else {
    return (
      <Text color="textSecondary" fontSize="xs">
        Posted{" "}
        <Text as="span" fontWeight="bold">
          {Math.floor(difference / (1000 * 60 * 60 * 24))} Day(s)
        </Text>{" "}
        ago
      </Text>
    );
  }
}

function BriefcaseSolid(): ReactElement {
  return <Briefcase weight="fill" size="20" />;
}

function MoneySolid(): ReactElement {
  return <Money weight="fill" size="20" />;
}

interface DeleteDialogProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  deleteJobCB: (() => Promise<void>) | null;
}

function DeleteDialog({
  jobId,
  isOpen,
  onClose,
  deleteJobCB,
}: DeleteDialogProps): ReactElement {
  const handleDelete = () => {
    axiosAuth
      .delete<GenericBackendRes>(`jobs/delete-job/${jobId}`)
      .then(async (res) => {
        toast.success(res.data.message);
        await deleteJobCB?.();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data.message ??
            "An error occurred while deleting this job"
        );
      });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header="Delete Job"
      message="Are you sure you want to delete this job? This action cannot be undone."
      btnColor="red"
      confirmationBtnTitle="Delete"
      handleConfirmation={handleDelete}
    />
  );
}

function EditDialog({ mutate, job, isOpen, onClose }: any): ReactElement {
  return (
    <EditJobModal mutate={mutate} job={job} isOpen={isOpen} onClose={onClose} />
  );
}

export default function Job(props: JobProps): ReactElement {
  const { user } = useUserContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  return (
    <Box width="full" px={5} py={4} rounded="4px" bgColor="bgPrimary">
      <VStack spacing={2} align="start">
        <HStack width="full" mt={2} align="start" justify="space-between">
          <VStack spacing={0} align="start">
            <Text
              color="text"
              noOfLines={1}
              fontWeight="semibold"
              fontSize="lg"
            >
              {props.title}
            </Text>
            <Text color="textSecondary" noOfLines={1} fontSize="sm">
              {props.company}
            </Text>
          </VStack>
          {user?.isAdmin || user?.isAcademicStaff ? (
            <OptionsMenu>
              <MenuList>
                <MenuItem color="" onClick={onEditOpen}>
                  <Icon mr={3} as={PencilIcon} h="24px" w="24px" />
                  <span>Edit Job</span>
                </MenuItem>
                <MenuItem color="red.500" onClick={onOpen}>
                  <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                  <span>Delete Job</span>
                </MenuItem>
              </MenuList>
            </OptionsMenu>
          ) : null}
        </HStack>
        {props.location && (
          <Text color="textSecondary" fontSize="sm">
            {props.location ?? "Remote"}
          </Text>
        )}
        {(props.type || props.pay) && (
          <Wrap>
            {props.type && (
              <Tag
                variant="solid"
                bgColor="bgSecondary"
                color="textMain"
                py={1}
              >
                <TagLeftIcon as={BriefcaseSolid} />
                <TagLabel ml={2} fontWeight="bold">
                  {jobType[props.type]}
                </TagLabel>
              </Tag>
            )}
            {props.pay && (
              <Tag
                variant="solid"
                bgColor="bgSecondary"
                color="textMain"
                py={1}
              >
                <TagLeftIcon as={MoneySolid} />
                <TagLabel ml={2} fontWeight="bold">
                  ${props.pay[0]}K
                  {props.pay[0] !== props.pay[1] ? `-${props.pay[1]}K` : null} /
                  Year
                </TagLabel>
              </Tag>
            )}
          </Wrap>
        )}
        <Text noOfLines={3} color="textMain" fontSize="xs">
          {props.description}
        </Text>
        <HStack width="full" justify="space-between">
          <RelativeTime date={props.datePosted} />
          <NextLink href={props.link} passHref>
            <Button
              as={ChakraLink}
              isExternal
              colorScheme="button"
              size="sm"
              rounded="lg"
              width={32}
              height={8}
            >
              Apply
            </Button>
          </NextLink>
        </HStack>
      </VStack>
      <DeleteDialog
        jobId={props.id}
        isOpen={isOpen}
        onClose={onClose}
        deleteJobCB={props.deleteJobCB}
      />
      <EditDialog
        mutate={props.mutate}
        job={props}
        isOpen={isEditOpen}
        onClose={onEditClose}
      />
    </Box>
  );
}
