import {
  Box,
  Flex,
  VStack,
  Text,
  Image,
  Badge,
  useDisclosure,
  Button,
  Divider,
  Spinner,
  HStack,
  MenuList,
  MenuItem,
  Icon,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import { useUserContext } from "src/contexts/userContext";
import AddCafeteriaItemModal from "src/components/AddCafeteriaItemModal";
import { GenericBackendRes, GetCafeteriaItemsRes } from "src/types/server";
import toast from "react-hot-toast";
import { ICafeteriaItem } from "src/types/interfaces";
import { AxiosError } from "axios";
import useSWRInfinite, { SWRInfiniteResponse } from "swr/infinite";
import { fetcher } from "src/utils/helpers";
import { VirtuosoGrid } from "react-virtuoso";
import styles from "src/styles/CafeteriaMenu.module.scss";
import OptionsMenu from "src/components/Options";
import { ToggleInterestData } from "server/validators/events";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";
import EditCafeteriaItemModal from "src/components/EditCafeterialItemModal";
import { axiosAuth } from "src/utils/axios";
import { Dialog } from "src/components/Dialog";
import { mutate } from "swr";

interface CafeteriaItemProps {
  name: string;
  price: string;
  imageURL?: string;
  createdAt: string;
  mutate?: any;
  id: string;
}

function CafeteriaItem({
  id,
  name,
  price,
  imageURL,
  createdAt,
  mutate,
}: CafeteriaItemProps): ReactElement {
  const isNew =
    Date.now() - new Date(createdAt).getTime() <= 3600 * 24 * 30 * 1000;
  const { user } = useUserContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  return (
    <VStack
      position="relative"
      spacing={0}
      align="start"
      bgColor="bgPrimary"
      overflow="hidden"
      rounded="4px"
    >
      <Image
        fit="cover"
        width="full"
        height="200px"
        src={imageURL ?? "/fallback-cafeteria-item.jpg"}
        alt={`Image for ${name}`}
      />
      <Box
        position="absolute"
        width="full"
        height="200px"
        bgColor="rgba(0, 0, 0, 0.55)"
      />
      {isNew ? (
        <Badge
          position="absolute"
          top={3}
          right={4}
          variant="subtle"
          colorScheme="green"
        >
          New
        </Badge>
      ) : null}
      <VStack px={4} py={2} align="start">
        <HStack width="full" mt={2} align="start" justify="space-between">
          <Text fontWeight="bold" fontSize="18px" mr={20}>
            {name}
          </Text>

          {user?.isAdmin || user?.isCafeteriaMan ? (
            <OptionsMenu>
              <MenuList>
                <MenuItem onClick={onEditOpen}>
                  <Icon mr={3} as={PencilIcon} h="24px" w="24px" />
                  <span>Edit Item</span>
                </MenuItem>
                <MenuItem color="red.500" onClick={onOpen}>
                  <Icon mr={3} as={TrashIcon} h="24px" w="24px" />
                  <span>Delete Item</span>
                </MenuItem>
              </MenuList>
            </OptionsMenu>
          ) : null}
        </HStack>

        <Text>{price}TL</Text>
      </VStack>
      <DeleteDialog
        cateriaId={id}
        isOpen={isOpen}
        onClose={onClose}
        mutate={mutate}
      />
      <EditDialog
        mutate={mutate}
        item={{ id, name, price }}
        isOpen={isEditOpen}
        onClose={onEditClose}
      />
    </VStack>
  );
}

interface CafeteriaMenuProps {
  swr: SWRInfiniteResponse<GetCafeteriaItemsRes, AxiosError<GenericBackendRes>>;
}

function DeleteDialog({
  cateriaId,
  isOpen,
  onClose,
  mutate,
}: any): ReactElement {
  const handleDelete = () => {
    axiosAuth
      .delete<GenericBackendRes>(`cafeteria/delete-item/${cateriaId}`)
      .then(async (res) => {
        toast.success(res.data.message);
        await mutate?.();
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
      header="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      btnColor="red"
      confirmationBtnTitle="Delete"
      handleConfirmation={handleDelete}
    />
  );
}

function EditDialog({ mutate, item, isOpen, onClose }: any): ReactElement {
  return (
    <EditCafeteriaItemModal
      mutate={mutate}
      item={item}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}

function CafeteriaMenu({ swr }: CafeteriaMenuProps): ReactElement {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [items, setItems] = useState<ICafeteriaItem[]>([]);

  const {
    data,
    error,
    isValidating,
    size: page,
    setSize: setPage,
    mutate,
  } = swr;

  const loadMoreItems = async () => {
    if (reachedEnd) {
      return;
    }

    await setPage(page + 1);
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
      setItems(
        data.reduce(
          (prev, curr) => curr.items.concat(prev),
          [] as ICafeteriaItem[]
        )
      );

      if (data[data.length - 1].items.length < 30) {
        setReachedEnd(true);
      }
    }

    if (error) {
      toast.error(
        error.response?.data.message ?? "An error occurred while fetching menu"
      );
    }
  }, [data, error]);

  if (!isValidating && data?.[0]?.items.length === 0)
    return (
      <VStack width="full" textAlign="center">
        <Image
          fit="cover"
          width="250px"
          src="/graphics/List_Is_Empty.png"
          alt="List is empty graphic"
        />
        <Text fontSize="3xl" fontWeight="bold">
          The cafeteria menu seems to be empty
        </Text>
      </VStack>
    );

  return (
    <VirtuosoGrid
      className={styles.menu}
      data={items}
      totalCount={items.length}
      endReached={loadMoreItems}
      useWindowScroll
      components={{
        Footer,
      }}
      itemContent={(_, item) => (
        <CafeteriaItem
          id={item.id}
          key={item.id}
          name={item.name}
          price={item.price}
          imageURL={item.imageURL}
          createdAt={item.createdAt}
          mutate={mutate}
        />
      )}
    />
  );
}

const getKey = (pageIndex: number) => {
  return `cafeteria/get-items/${pageIndex}`;
};

export default function Cafeteria(): ReactElement {
  const { user } = useUserContext();

  const swr = useSWRInfinite<
    GetCafeteriaItemsRes,
    AxiosError<GenericBackendRes>
  >(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex gap="10">
      <VStack spacing={4} align="start" flex="7">
        {user?.isAdmin || user?.isCafeteriaMan ? (
          <VStack width="full" align="start" spacing={5}>
            <VStack width="full" align="start" spacing={5}>
              <Text fontSize="18px" fontWeight="semibold">
                New cafeteria items are available? Add them below
              </Text>
              <Button colorScheme="button" size="sm" px={8} onClick={onOpen}>
                Add Item
              </Button>
            </VStack>
            <Divider height="1px" bgColor="bgSecondary" />
            <AddCafeteriaItemModal
              mutate={swr.mutate}
              isOpen={isOpen}
              onClose={onClose}
            />
          </VStack>
        ) : null}
        <Text fontSize="xl" fontWeight="semibold">
          Cafeteria Menu
        </Text>
        <CafeteriaMenu swr={swr} />
      </VStack>
    </Flex>
  );
}
