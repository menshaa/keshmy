import {
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  HStack,
  FormLabel,
  Button,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderMark,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import toast from "react-hot-toast";
import Input from "src/components/Input";
import Switch from "src/components/Switch";
import Textarea from "src/components/Textarea";
import { GenericBackendRes, GetJobsRes } from "src/types/server";
import { axiosAuth } from "src/utils/axios";
import { KeyedMutator } from "swr";

interface EditJobModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  mutate: any;
}

interface SalaryInputProps {
  salary: number[];
  setSalary: Dispatch<SetStateAction<number[]>>;
}

function SalaryInput({ salary, setSalary }: SalaryInputProps): ReactElement {
  return (
    <>
      <FormLabel htmlFor="salary">Salary</FormLabel>
      <RangeSlider
        name="salary"
        colorScheme="accent"
        aria-label={["minimum salary", "maximum salary"]}
        min={10}
        max={150}
        step={5}
        defaultValue={salary}
        onChangeEnd={(val) => setSalary(val)}
      >
        <RangeSliderMark value={25} mt="2" ml="-4" fontSize="sm">
          $25K
        </RangeSliderMark>
        <RangeSliderMark value={50} mt="2" ml="-4" fontSize="sm">
          $50K
        </RangeSliderMark>
        <RangeSliderMark value={75} mt="2" ml="-4" fontSize="sm">
          $75K
        </RangeSliderMark>
        <RangeSliderMark value={100} mt="2" ml="-5" fontSize="sm">
          $100K
        </RangeSliderMark>
        <RangeSliderMark value={125} mt="2" ml="-5" fontSize="sm">
          $125K
        </RangeSliderMark>
        <RangeSliderMark
          value={salary[0]}
          textAlign="center"
          bg="green"
          color="white"
          mt="-10"
          ml="-5"
          fontSize="sm"
          w="10"
        >
          {salary[0]}
        </RangeSliderMark>
        <RangeSliderMark
          value={salary[1]}
          textAlign="center"
          bg="green"
          color="white"
          mt="-10"
          ml="-5"
          fontSize="sm"
          w="10"
        >
          {salary[1]}
        </RangeSliderMark>
        <RangeSliderTrack bg="bgSecondary">
          <RangeSliderFilledTrack />
        </RangeSliderTrack>
        <RangeSliderThumb boxSize={5} index={0} />
        <RangeSliderThumb boxSize={5} index={1} />
      </RangeSlider>
    </>
  );
}

export default function EditJobModal({
  mutate,
  job,
  isOpen,
  onClose,
}: EditJobModalProps): ReactElement {
  const [isRemote, setRemote] = useState(job.location === "Remote");
  const [salary, setSalary] = useState([50, 75]);
  const [isSubmitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    type: job.type,
    link: job.link,
    salary: job.salary,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!Object.values(form).every(Boolean) && !isRemote) {
      toast.error("All fields must be set");
      return;
    }

    if (isRemote) form.location = "Remote";
    form.salary = salary;

    setSubmitting(true);

    axiosAuth
      .patch<GenericBackendRes>(`jobs/edit-job/${job.id}`, form)
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        if (mutate) {
          await mutate();
        }
        onClose();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the job"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit a Job</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody overflowX="hidden">
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3} align="start">
              <Input
                defaultValue={form.title}
                placeholder="Title"
                name="title"
                onChange={handleChange}
              />
              <Textarea
                defaultValue={form.description}
                placeholder="Description"
                name="description"
                onChange={handleChange}
              />
              <Input
                defaultValue={form.company}
                placeholder="Company"
                name="company"
                onChange={handleChange}
              />
              <HStack width="full" justify="space-between">
                <FormLabel m={0} htmlFor="remote">
                  Remote
                </FormLabel>
                <Switch
                  id="remote"
                  isChecked={isRemote}
                  onChange={() => setRemote(!isRemote)}
                />
              </HStack>
              <Input
                disabled={isRemote}
                defaultValue={form.location}
                placeholder="Location"
                name="location"
                onChange={handleChange}
              />
              <Select
                defaultValue={form.type}
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
                <option value="FullTime">Full-Time</option>
                <option value="PartTime">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </Select>
              <Input
                defaultValue={form.link}
                placeholder="Link"
                name="link"
                onChange={handleChange}
              />
              <SalaryInput salary={salary} setSalary={setSalary} />
            </VStack>
            <Button
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Submitting"
              onClick={handleSubmit}
            >
              Edit
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
