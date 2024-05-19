import dynamic from "next/dynamic";
import { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/provider";

import theme from "src/theme";
import { UserWrapper } from "src/contexts/userContext";
import LoggedOutLayout from "src/components/LoggedOutLayout";
import LoggedInLayout from "src/components/LoggedInLayout";
const Fonts = dynamic(() => import("src/components/Fonts"));
const Header = dynamic(() => import("src/components/Header"));
const Toaster = dynamic(() => import("react-hot-toast").then((t) => t.Toaster));

import "src/styles/global.scss";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";
import "swiper/scss/zoom";

export interface PageProps {
    noAuthPage: boolean;
    notFoundPage: boolean;
}

function MyApp({ Component, pageProps }: AppProps<PageProps>) {
    return (
        <ChakraProvider theme={theme}>
            <UserWrapper>
                <Toaster
                    toastOptions={{
                        style: {
                            backgroundColor: "var(--chakra-colors-bgThird)",
                            color: "white",
                        }
                    }}
                />
                <Fonts />
                <Header />
                {Component.defaultProps?.noAuthPage ? (
                    <LoggedOutLayout>
                        <Component {...pageProps} />
                    </LoggedOutLayout>
                ) : (
                    <LoggedInLayout>
                        <Component {...pageProps} />
                    </LoggedInLayout>
                )}
            </UserWrapper>
        </ChakraProvider>
    );
}

export default MyApp;
