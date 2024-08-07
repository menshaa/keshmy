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
  HStack,
  Wrap,
  Icon,
} from "@chakra-ui/react";
import { CheckSquare, XSquare } from "phosphor-react";
import { ReactElement, useEffect, useState } from "react";
import CheckBox from "src/components/Checkbox";
import { Dialog } from "src/components/Dialog";
import { IUser } from "src/types/interfaces";
import useSWR from "swr";
import { axiosAuth } from "src/utils/axios";
import { AdminAccountsRes } from "src/types/server";
import toast from "react-hot-toast";
import { fetcher } from "src/utils/helpers";
import Router from "next/router";
import { ArrowLeftIcon } from "@chakra-ui/icons";

export default function PendingStudentAccounts(): ReactElement {
  const [page, setPage] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [accounts, setAccounts] = useState<(IUser & { selected: boolean })[]>(
    []
  );

  const { data, mutate, error, isValidating } = useSWR(
    `admin/get-all-pending-students?page=${page}`,
    fetcher<AdminAccountsRes>,
    {
      revalidateOnFocus: false,
    }
  );

  const allChecked = accounts.length
    ? accounts.every((a) => a.selected)
    : false;
  const anyChecked = accounts.length ? accounts.some((a) => a.selected) : false;
  const isIndeterminate = anyChecked && !allChecked;
  const pages = Math.ceil(accountCount / 25);

  const {
    isOpen: isApproveOpen,
    onOpen: onApproveOpen,
    onClose: onApproveClose,
  } = useDisclosure();

  const maxTableHeight = {
    base: "calc(100vh - var(--chakra-headerHeight-mobile) - var(--chakra-navBarHeight) - 200px)",
    md: "calc(100vh - var(--chakra-headerHeight-desktop) - 220px)",
  };

  const handleApprove = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/approve-users", { ids }), {
        optimisticData: {
          accounts: accounts.map((a) =>
            ids.includes(a.id) ? { ...a, approved: true } : a
          ),
          accountCount: accountCount,
        },
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });
    } catch (e) {
      toast.error("An error occurred while approving the accounts");
    }
  };

  useEffect(() => {
    if (data) {
      setAccounts(data.accounts.map((a) => ({ ...a, selected: false })));
      setAccountCount(data.accountCount);
    }

    if (error) {
      toast.error(
        error?.response?.data?.message ??
          "An error occurred while fetching pending student accounts"
      );
    }
  }, [data, error]);

  return (
    <>
      <VStack align="start" width="full">
        <HStack>
          <Button onClick={() => Router.back()}>
            <Icon as={ArrowLeftIcon}></Icon>
          </Button>
          <Text fontWeight="semibold">Pending Student Accounts</Text>
        </HStack>
        <TableContainer
          width="full"
          border="1px solid var(--chakra-colors-bgSecondary)"
          maxHeight={maxTableHeight}
          overflowY="scroll"
          rounded="2px"
        >
          <Table
            colorScheme="button"
            sx={{
              "& th": { textTransform: "none", color: "text" },
              "& td": { textTransform: "none", fontSize: "sm" },
              "& tr > *:nth-of-type(2)": { pl: "0px" },
              "& tr > :first-of-type": { pl: "15px", pr: "15px" },
            }}
          >
            <Thead
              bgColor="bgSecondary"
              textTransform="none"
              position="sticky"
              top="0"
              zIndex={1}
            >
              <Tr>
                <Th>
                  <CheckBox
                    isDisabled={isValidating || accounts.length === 0}
                    isChecked={allChecked}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) =>
                      setAccounts((a) => {
                        return a.map((box) => {
                          box = { ...box, selected: e.target.checked };
                          return box;
                        });
                      })
                    }
                  />
                </Th>
                <Th>Username</Th>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Surname</Th>
                <Th>Approved</Th>
              </Tr>
            </Thead>
            <Tbody bgColor="bgPrimary">
              {!isValidating && pages === 0 && accounts.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <VStack width="full">
                      <Text>There are no accounts to manage</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : null}
              {isValidating || (pages !== 0 && accounts.length === 0) ? (
                <Tr>
                  <Td colSpan={7}>
                    <VStack width="full">
                      <Spinner />
                    </VStack>
                  </Td>
                </Tr>
              ) : null}
              {!isValidating &&
                accounts.map((account, i) => (
                  <Tr key={account.id}>
                    <Td>
                      <CheckBox
                        id={account.id}
                        isChecked={account.selected}
                        onChange={(e) => {
                          setAccounts((a) => {
                            return a.map((box, j) => {
                              if (j === i)
                                box = { ...box, selected: e.target.checked };
                              return box;
                            });
                          });
                        }}
                      />
                    </Td>
                    <Td>{account.username}</Td>
                    <Td>{account.email}</Td>
                    <Td>{account.name}</Td>
                    <Td>{account.surname}</Td>
                    <Td>
                      {account.approved ? (
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
                {accounts.length}
              </Text>{" "}
              Students - {accounts.filter((a) => a.selected).length} of{" "}
              {accounts.length} selected
            </Text>
            <ButtonGroup as={Wrap} size="sm" isDisabled={!anyChecked}>
              <Button
                rounded="8px"
                colorScheme="green"
                width="90px"
                height="30px"
                onClick={onApproveOpen}
              >
                Approve
              </Button>
            </ButtonGroup>
          </VStack>
          <VStack align="end" justify="space-between">
            {pages !== 0 && (
              <Text fontSize="sm" fontWeight="bold">
                Page {page + 1}/{pages}
              </Text>
            )}
            <ButtonGroup
              isDisabled={Boolean(accounts.length)}
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
                isDisabled={page >= pages - 1}
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
        header="Approve accounts"
        message={`Are you sure you want to approve ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="green"
        confirmationBtnTitle="Approve"
        handleConfirmation={handleApprove}
      />
    </>
  );
}
