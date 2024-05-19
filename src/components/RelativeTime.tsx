import { memo, ReactElement } from "react";
import { Text } from "@chakra-ui/react";

interface RelativeTimeProps {
    date: string;
    type?: "post" | "conversation";
}

const RelativeTime = memo(function RelativeTime({ date, type = "post" }: RelativeTimeProps): ReactElement {
    const now = new Date();
    const postDate = new Date(date);
    const difference = now.getTime() - postDate.getTime();


    if (now.getFullYear() > postDate.getFullYear()) {
        // different years
        return (
            <Text as="span">
                {postDate.getDate()}{" "}
                {postDate.toLocaleString("default", { month: "short" })}{" "}
                {postDate.getFullYear()} |{" "}
                {postDate.toLocaleString("default", {
                    hour: "numeric",
                    minute: "2-digit",
                })}
            </Text>
        );
    } else if (difference >= 1000 * 60 * 60 * 24 * 7) {
        // older than 7 days. display month and day
        return (
            <Text as="span">
                {postDate.toLocaleString("default", { month: "short" })}{" "}
                {postDate.getDate()}
            </Text>
        );
    } else if (difference >= 1000 * 60 * 60 * 24) {
        const suffix = type === "post" ? " day(s) ago" : "d";

        // older than 24 hours. display days
        return (
            <Text as="span">
                {Math.floor(difference / (1000 * 60 * 60 * 24))}{suffix}
            </Text>
        );
    } else if (difference >= 1000 * 60 * 60) {
        const suffix = type === "post" ? " hour(s) ago" : "h";

        // older than 60 minutes. display hours
        return (
            <Text as="span">{Math.floor(difference / (1000 * 60 * 60))}{suffix}</Text>
        );
    } else if (difference >= 1000 * 60) {
        const suffix = type === "post" ? " minute(s) ago" : "m";

        // older than 60 seconds. display minutes
        return (
            <Text as="span">{Math.floor(difference / (1000 * 60))}{suffix}</Text>
        );
    } else if (difference >= 1000 * 5) {
        const suffix = type === "post" ? " second(s) ago" : "s";

        // older than 5 seconds. display seconds
        return <Text as="span">{Math.floor(difference / 1000)}{suffix}</Text>;
    } else {
        const message = type === "post" ? "A few seconds ago" : "now";
        // younger than 5 seconds. display "now"
        return <Text as="span">{message}</Text>;
    }
});

export default RelativeTime;
