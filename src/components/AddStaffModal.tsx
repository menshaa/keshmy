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
  Select,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ReactElement, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import { GenericBackendRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutate: any;
}

interface AddStaffData {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  isAcademicStaff: boolean;
  isCafeteriaMan: boolean;
  type?: string;
}

export default function AddStaffModal({
  isOpen,
  onClose,
  mutate,
}: AddStaffModalProps): ReactElement {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddStaffData>({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    isAcademicStaff: false,
    isCafeteriaMan: false,
    type: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (
      !form.name ||
      !form.surname ||
      !form.username ||
      !form.email ||
      !form.password ||
      !form.passwordConfirm ||
      !form.type
    ) {
      console.log("form: ", form);

      toast.error("All fields must be filled");
      return;
    }

    if (form.type === "Academic") {
      form.isAcademicStaff = true;
    }
    if (form.type === "Cafeteria") {
      form.isCafeteriaMan = true;
    }

    delete form.type;

    setSubmitting(true);

    axiosAuth
      .post<GenericBackendRes>("admin/staff-account", form)
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        await mutate();
        onClose();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting your staff"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Add a Staff</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3}>
              <Input placeholder="Name" name="name" onChange={handleChange} />
              <Input
                placeholder="Surname"
                name="surname"
                onChange={handleChange}
              />
              <Input
                placeholder="Username"
                name="username"
                onChange={handleChange}
              />
              <Input placeholder="Email" name="email" onChange={handleChange} />
              <Input
                placeholder="Password"
                name="password"
                onChange={handleChange}
                type="password"
              />
              <Input
                placeholder="Confirm Password"
                name="passwordConfirm"
                type="password"
                onChange={handleChange}
              />
              <Select
                placeholder="Type"
                variant="filled"
                rounded="10px"
                colorScheme="conversationItem"
                focusBorderColor="button.500"
                bgColor="bgSecondary"
                border="1px solid"
                borderColor="stroke"
                _hover={{
                  borderColor: "button.400",
                  bgColor: "bgSecondary",
                }}
                _focus={{
                  border: "2px solid",
                  bgColor: "bgSecondary",
                }}
                name="type"
                onChange={handleChange}
              >
                <option value="Academic">Academic</option>
                <option value="Cafeteria">Cafeteria</option>
              </Select>
            </VStack>
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Submitting"
              onClick={handleSubmit}
            >
              Add
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
