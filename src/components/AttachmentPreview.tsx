import { Box, Flex, Icon, IconButton, Image } from "@chakra-ui/react";
import { XIcon } from "@heroicons/react/outline";
import { ReactElement } from "react";

interface AttachmentPreviewProps {
    image: string;
    idx: number;
    size?: string | number;
    removeAttachment: (idx: number) => void;
}

export default function AttachmentPreview({ image, idx, ...props }: AttachmentPreviewProps): ReactElement {
    return (
        <Box
            position="relative"
            border="1px solid var(--chakra-colors-bgThird)"
            rounded="lg"
        >
            <Box
                boxSize={props.size}
                rounded="md"
                position="absolute"
                top="0"
                right="0"
                backgroundColor="rgba(0, 0, 0, 0.3)"
            />
            <Flex
                as={IconButton}
                icon={<Icon as={XIcon} w={6} h={6} />}
                size="sm"
                justifyContent="center"
                alignItems="center"
                colorScheme="red"
                rounded="lg"
                position="absolute"
                top={-3}
                right={-3}
                onClick={() => props.removeAttachment(idx)}
            />
            <Image
                fit="cover"
                boxSize={props.size}
                minWidth={props.size}
                rounded="md"
                src={image}
                alt={`Attachment ${idx + 1}`}
            />
        </Box>
    );
}

AttachmentPreview.defaultProps = {
    size: "100px",
};
