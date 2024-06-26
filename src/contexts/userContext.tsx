import { createContext, ReactElement, useContext, useEffect, useState, PropsWithChildren } from "react";
import { IUser } from "src/types/interfaces";
import useSWR, { KeyedMutator } from "swr";
import { Spinner, VStack } from "@chakra-ui/react";
import { io, Socket } from "socket.io-client";

interface UserContextType {
    user: IUser | null;
    login: () => void;
    logout: () => void;
    mutate: KeyedMutator<{ user: any }>;
    socket: Socket | null;
}

const UserContextDefaultValues : UserContextType = {
    user: null,
    login: () => {void 0;},
    logout: () => {void 0;},
    mutate: async () => undefined,
    socket: null,
};

const UserContext = createContext<UserContextType>(UserContextDefaultValues);

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            return { user: data?.user };
        });

export function UserWrapper({ children }: PropsWithChildren): ReactElement {
    const [user, setUser] = useState<IUser | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [loading, setLoading] = useState(true);

    const { data, mutate, isValidating } = useSWR(
        "/api/users/validate-token",
        fetcher,
    );

    const openSocket = () => {
        const _socket = io();

        setSocket(_socket);
        console.log("Websocket opened");
    };

    useEffect(() => {
        if (isValidating) {
            return;
        }

        if (data) {
            setUser(data.user);
            openSocket();
            setLoading(false);
        } else {
            setUser(null);
            setLoading(true);
        }
    }, [data]);

    const login = () => {
        mutate();
        openSocket();
    };

    const logout = () => {
        socket?.close();
        setSocket(null);
        mutate();
    };

    if (loading) return <VStack width="full"><Spinner size="xl" label="Loading..." /></VStack>;

    return (
        <UserContext.Provider value={{user, socket, login, logout, mutate}}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext(): UserContextType {
    return useContext(UserContext);
}

