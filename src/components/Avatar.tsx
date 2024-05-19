import { AvatarProps, Avatar as ChakraAvatar, forwardRef } from "@chakra-ui/react";
import { ReactElement } from "react";

const Avatar = forwardRef<AvatarProps, "span">((props, ref): ReactElement => {
    return (
        <ChakraAvatar
            ref={ref}
            {...props}
            sx={{ "> img": { borderRadius: props.rounded } }}
        />
    );
});

export default Avatar;
