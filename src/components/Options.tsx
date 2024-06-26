import { ReactElement } from "react";
import { DotsThree, DotsThreeVertical } from "phosphor-react";
import {
    Box,
    Menu,
    Icon,
    MenuButton,
    MenuButtonProps,
    ChakraComponent,
    IconButton,
    BoxProps,
} from "@chakra-ui/react";

interface OptionsMenuProps {
    buttonSize?: string;
    direction?: "horizontal" | "vertical";
}

interface OptionsButtonProps {
    size?: string;
    direction?: "horizontal" | "vertical";
}

type OptionsButton = ChakraComponent<"button", OptionsButtonProps>;
type OptionsMenu = ChakraComponent<"div", OptionsMenuProps>;

function ThreeDots(): ReactElement {
    return <DotsThree size={32} />;
}

function ThreeDotsVertical(): ReactElement {
    return <DotsThreeVertical size={32} />;
}

const OptionsButton = ((props: MenuButtonProps & OptionsButtonProps) => {
    return (
        <MenuButton
            {...props}
            as={IconButton}
            variant="ghost"
            colorScheme="button"
            minWidth="full"
            height="full"
            boxSize={props.size ?? ""}
            aria-label="Options"
            color="textMain"
            rounded="md"
            icon={
                <Icon
                    as={props.direction === "vertical" ? ThreeDotsVertical : ThreeDots}
                />
            }
        />
    );
}) as OptionsButton;

const OptionsMenu = ((props: BoxProps & OptionsMenuProps) => {
    return (
        <Box>
            <Menu placement="bottom-end">
                <OptionsButton size={props.buttonSize} direction={props.direction} />
                {props.children}
            </Menu>
        </Box>
    );
}) as OptionsMenu;

export default OptionsMenu;
