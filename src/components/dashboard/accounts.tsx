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

export default function Accounts(): ReactElement {
  const [page, setPage] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [accounts, setAccounts] = useState<(IUser & { selected: boolean })[]>(
    []
  );

  const { data, mutate, error, isValidating } = useSWR(
    `admin/get-all-users?page=${page}`,
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
    isOpen: isAdminOpen,
    onOpen: onAdminOpen,
    onClose: onAdminClose,
  } = useDisclosure();
  const {
    isOpen: isRemoveAdminOpen,
    onOpen: onRemoveAdminOpen,
    onClose: onRemoveAdminClose,
  } = useDisclosure();
  const {
    isOpen: isUnrestrictOpen,
    onOpen: onUnrestrictOpen,
    onClose: onUnrestrictClose,
  } = useDisclosure();
  const {
    isOpen: isRestrictOpen,
    onOpen: onRestrictOpen,
    onClose: onRestrictClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const maxTableHeight = {
    base: "calc(100vh - var(--chakra-headerHeight-mobile) - var(--chakra-navBarHeight) - 200px)",
    md: "calc(100vh - var(--chakra-headerHeight-desktop) - 220px)",
  };

  const handleAddAdmin = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/add-admin", { ids }), {
        optimisticData: {
          accounts: accounts.map((a) =>
            ids.includes(a.id) ? { ...a, restricted: false } : a
          ),
          accountCount: accountCount,
        },
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });
    } catch (e) {
      toast.error("An error occurred while add admin the accounts");
    }
  };
  const handleRemoveAdmin = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/remove-admin", { ids }), {
        optimisticData: {
          accounts: accounts.map((a) =>
            ids.includes(a.id) ? { ...a, restricted: false } : a
          ),
          accountCount: accountCount,
        },
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });
    } catch (e) {
      toast.error("An error occurred while remove admin the accounts");
    }
  };
  const handleUnrestrict = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/unrestrict-users", { ids }), {
        optimisticData: {
          accounts: accounts.map((a) =>
            ids.includes(a.id) ? { ...a, restricted: false } : a
          ),
          accountCount: accountCount,
        },
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });
    } catch (e) {
      toast.error("An error occurred while unrestricting the accounts");
    }
  };

  const handleRestrict = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/restrict-users", { ids }), {
        optimisticData: {
          accounts: accounts.map((a) =>
            ids.includes(a.id) ? { ...a, restricted: true } : a
          ),
          accountCount: accountCount,
        },
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });
    } catch (e) {
      toast.error("An error occurred while restricting the accounts");
    }
  };

  const handleDelete = async () => {
    const ids = accounts.reduce((prev, curr) => {
      if (curr.selected) prev.push(curr.id);
      return prev;
    }, [] as string[]);

    try {
      await mutate(axiosAuth.patch("admin/delete-users", { ids }), {
        optimisticData: {
          accounts: accounts.filter((a) => !ids.includes(a.id)),
          accountCount: accountCount - ids.length,
        },
        populateCache: false,
        revalidate:
          (page === 0 && allChecked && pages > 1) || (page !== 0 && allChecked),
        rollbackOnError: true,
      });

      if (pages > 1 && allChecked) {
        setPage((page) => (page === 0 ? page : page - 1));
      }
    } catch (e) {
      toast.error("An error occurred while deleting the accounts");
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
          "An error occurred while fetching accounts"
      );
    }
  }, [data, error]);

  return (
    <>
      <VStack align="start" width="full">
        <HStack>
          <Button
            color="white"
            size="sm"
            px={8}
            onClick={() => Router.push("/staff-accounts")}
          >
            Staff Accounts
          </Button>
          <Button
            color="white"
            size="sm"
            px={8}
            onClick={() => Router.push("/pending-student-accounts")}
          >
            Pending Student Accounts
          </Button>
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
                <Th>Admin</Th>
                <Th>Approved</Th>
                <Th>Restricted</Th>
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
                    <Td>{account.isAdmin.toString()}</Td>
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
                    <Td>
                      {account.restricted ? (
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
              Accounts - {accounts.filter((a) => a.selected).length} of{" "}
              {accounts.length} selected
            </Text>
            <ButtonGroup as={Wrap} size="sm" isDisabled={!anyChecked}>
              <Button
                rounded="8px"
                colorScheme="green"
                width="90px"
                height="30px"
                onClick={onAdminOpen}
              >
                Add Admin
              </Button>
              <Button
                rounded="8px"
                colorScheme="red"
                width="120px"
                height="30px"
                onClick={onRemoveAdminOpen}
              >
                Remove Admin
              </Button>
              <Button
                rounded="8px"
                colorScheme="grey"
                width="90px"
                height="30px"
                color="text"
                onClick={onUnrestrictOpen}
              >
                Unrestrict
              </Button>
              <Button
                rounded="8px"
                colorScheme="grey"
                width="90px"
                height="30px"
                color="text"
                onClick={onRestrictOpen}
              >
                Restrict
              </Button>
              <Button
                rounded="8px"
                colorScheme="red"
                width="90px"
                height="30px"
                onClick={onDeleteOpen}
              >
                Delete
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
        isOpen={isAdminOpen}
        onClose={onAdminClose}
        header="Add Admin"
        message={`Are you sure you want to add admin for ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="green"
        confirmationBtnTitle="Add Admin"
        handleConfirmation={handleAddAdmin}
      />
      <Dialog
        isOpen={isRemoveAdminOpen}
        onClose={onRemoveAdminClose}
        header="Add Admin"
        message={`Are you sure you want to remove admin for ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="red"
        confirmationBtnTitle="Remove Admin"
        handleConfirmation={handleRemoveAdmin}
      />
      <Dialog
        isOpen={isUnrestrictOpen}
        onClose={onUnrestrictClose}
        header="Unrestrict accounts"
        message={`Are you sure you want to unrestrict ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="green"
        confirmationBtnTitle="Unrestrict"
        handleConfirmation={handleUnrestrict}
      />
      <Dialog
        isOpen={isRestrictOpen}
        onClose={onRestrictClose}
        header="Restrict accounts"
        message={`Are you sure you want to restrict ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="yellow"
        confirmationBtnTitle="Restrict"
        handleConfirmation={handleRestrict}
      />
      <Dialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        header="Delete accounts"
        message={`Are you sure you want to delete ${
          accounts.filter((a) => a.selected).length
        } account(s)?`}
        btnColor="red"
        confirmationBtnTitle="Delete"
        handleConfirmation={handleDelete}
      />
    </>
  );
}
