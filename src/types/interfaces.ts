import { PostType } from "@prisma/client";
import { ComponentType } from "react";

interface IUserSettings {
    showRealName: boolean;
    showEmail: boolean;
    allowAllDMs: boolean;
    readReceipts: boolean;
}

export interface IUser {
    id: string;
    name?: string;
    surname?: string;
    username: string;
    email?: string;
    avatarURL: string;
    settings?: IUserSettings;
    twoFactorAuth: boolean;
    isAdmin: boolean;
    isAcademicStaff?: boolean;
    isUnderGrad?: boolean;
    isClubMember?: boolean;
    approved?: boolean;
    restricted?: boolean;
}

export interface ISearchUser {
    id: string;
    name: string;
    username: string;
    avatarURL: string | null;
    allowAllDMs: boolean;
}

export interface IClubMember {
    id: string;
    name: string;
    username: string;
    avatarURL: string | null;
}

export interface IEvent {
    id: string;
    title: string;
    description?: string;
    time: string;
    location: string;
    imageURL?: string;
    interest: number;
    isInterested?: boolean;
    approved: boolean;
    createdAt: string;
}

export interface IConversation {
    id: string;
    recipientId: string;
    recipientUsername: string;
    recipientName: string;
    recipientAvatarURL: string;
    lastMessage: string;
    updatedAt: string;
}

export interface IMessage {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    conversationId: string;
    wasRead: boolean;
    attachmentURL: string | null;
}

export interface IAnnouncement {
    id: string;
    title: string;
    content?: string;
    publishDate?: string;
    createdAt: string;
    approved?: boolean;
}

export interface ISearchAnnouncement {
    id: string;
    title: string;
    content: string;
    publishDate: string;
}

export interface IArticle {
    id: string;
    title: string;
    content?: string;
    authorName: string;
    authorUsername: string;
    publishDate?: string;
    createdAt: string;
    approved?: boolean;
}

export interface ISearchArticle {
    id: string;
    title: string;
    content: string;
    publishDate: string;
    authorName: string;
    authorUsername: string;
}

interface IAuthor {
    name: string;
    surname: string;
    username: string;
}

export interface IJob {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    createdAt: string;
    link: string;
    salary: number[];
}

export interface IDashboardArticle {
    id: string;
    title: string;
    author: IAuthor;
    createdAt: string;
    approved: boolean;
}

export interface IPost {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatarURL: string;
    attachments: string[] | null;
    likes: number;
    liked: boolean;
    comments: number;
    parentAuthorUsername: string | null;
    type: PostType;
    createdAt: string;
    groupName: string | null
}

export interface IPostAuthor {
    id: string;
    name: string;
    username: string;
    avatarURL: string;
}

export interface ICafeteriaItem {
    id: string;
    name: string;
    price: string;
    imageURL?: string;
    createdAt: string;
}

export type SettingItem = {
    id: string;
    title: string;
    settings: ComponentType<Record<string, never>>;
};

export type DashboardItem = {
    id: string;
    title: string;
    component: ComponentType<Record<string, never>>;
};

export interface SearchResultsTabProps {
    query: string;
}

export interface IGroup {
    id: string;
    name: string;
    description: string;
    isJoined: boolean;
}
