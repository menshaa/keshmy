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
} from "@chakra-ui/react";
import { forwardRef, ReactElement, useState, Ref, createElement } from "react";
import Input, { InputProps } from "src/components/Input";
import DatePicker from "react-datepicker";
import Textarea from "src/components/Textarea";

import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { axiosAuth } from "src/utils/axios";
import { GenericBackendRes } from "src/types/server";
import { AxiosError } from "axios";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  mutate?: any;
}

const DatePickerInput = (props: InputProps, ref: Ref<HTMLInputElement>) => {
  return <Input ref={ref} {...props} />;
};

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  mutate,
}: EditEventModalProps): ReactElement {
  const [eventDate, setEventDate] = useState<Date | null>(
    event.date ? new Date(event.date) : new Date(Date.now() + 3600 * 24 * 1000)
  );
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    location: event.location,
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
    if (!form.title || !form.location || !form.description || !eventDate) {
      toast.error("All fields must be filled");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("location", form.location);
    payload.append("time", eventDate.toISOString());

    axiosAuth
      .patch<GenericBackendRes>(`events/edit-event/${event.id}`, payload)
      .then(async (res) => {
        toast.success(res.data.message);
        setSubmitting(false);
        await mutate?.();
        onClose();
      })
      .catch((e: AxiosError<GenericBackendRes>) => {
        toast.error(
          e.response?.data?.message ??
            "An error occurred while submitting the event"
        );
        setSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bgColor="bgMain">
        <ModalHeader>
          <Text>Edit an Event</Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack width="full" align="end" spacing={5}>
            <VStack width="full" spacing={3} align="start">
              <Input
                defaultValue={event.title}
                placeholder="Title"
                name="title"
                onChange={handleChange}
              />
              <DatePicker
                selected={eventDate}
                onChange={(date) => setEventDate(date)}
                showTimeSelect
                dateFormat="Pp"
                placeholderText="Date and Time"
                minDate={new Date(Date.now() + 3600 * 24 * 1000)}
                timeIntervals={15}
                strictParsing
                customInput={createElement(forwardRef(DatePickerInput))}
              />
              <Input
                defaultValue={event.location}
                placeholder="Location"
                name="location"
                onChange={handleChange}
              />
              <Textarea
                defaultValue={event.description}
                placeholder="Description"
                name="description"
                onChange={handleChange}
              />
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
