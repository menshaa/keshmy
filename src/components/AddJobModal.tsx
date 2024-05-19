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

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    mutate: KeyedMutator<GetJobsRes[]> | null;
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

export default function AddJobModal({ isOpen, onClose, mutate }: AddJobModalProps): ReactElement {
    const [isRemote, setRemote] = useState(false);
    const [salary, setSalary] = useState([50, 75]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        company: "",
        location: "",
        type: "",
        link: "",
        salary: [] as number[],
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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

        if (!form.location && isRemote) form.location = "Remote";
        form.salary = salary;

        setSubmitting(true);

        axiosAuth.post<GenericBackendRes>("jobs/add-job", form)
            .then(async (res) => {
                toast.success(res.data.message);
                setSubmitting(false);
                await mutate?.();
                onClose();
            })
            .catch((e: AxiosError<GenericBackendRes>) => {
                toast.error(e.response?.data?.message ?? "An error occurred while submitting the job");
                setSubmitting(false);
            });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bgColor="bgMain">
                <ModalHeader>
                    <Text>Add a Job</Text>
                </ModalHeader>
                <ModalCloseButton size="lg" />
                <ModalBody overflowX="hidden">
                    <VStack width="full" align="end" spacing={5}>
                        <VStack width="full" spacing={3} align="start">
                            <Input
                                placeholder="Title"
                                name="title"
                                onChange={handleChange}
                            />
                            <Textarea
                                placeholder="Description"
                                name="description"
                                onChange={handleChange}
                            />
                            <Input
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
                                placeholder="Location"
                                name="location"
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
                                <option value="FullTime">Full-Time</option>
                                <option value="PartTime">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </Select>
                            <Input
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
                            Add
                        </Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
