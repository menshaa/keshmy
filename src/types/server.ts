import {
    IAnnouncement,
    IArticle,
    IUser,
    IEvent,
    ICafeteriaItem,
    IDashboardArticle,
    IConversation,
    IMessage,
    ISearchUser,
    ISearchAnnouncement,
    ISearchArticle,
    IJob,
    IPost,
    IClubMember,
    IGroup,
} from "./interfaces";

export interface GenericBackendRes {
    message: string;
}

export interface LoginRes extends GenericBackendRes {
    user: IUser;
    requiresTwoFactorAuth: boolean;
}

export interface ValidateResetPasswordTokenRes extends GenericBackendRes {
    user: IUser;
}

export interface ValidateTokenRes {
    user: IUser;
}

export interface TwoFASecretRes extends GenericBackendRes {
    secret: string;
    qrcode: string;
}

export interface AdminArticlesRes {
    articles: IDashboardArticle[];
    articleCount: number;
}

export interface AdminAnnouncementsRes {
    announcements: IAnnouncement[];
    announcementCount: number;
}

export interface AdminAccountsRes {
    accounts: IUser[];
    accountCount: number;
}

export interface AdminEventsRes {
    events: IEvent[];
    eventCount: number;
}

export interface GetArticlesRes extends GenericBackendRes {
    articles: IArticle[];
}

export interface GetArticleRes extends GenericBackendRes {
    article: IArticle | undefined;
}

export interface GetUserRes extends GenericBackendRes {
    user: IUser | undefined;
}

export interface GetPostRes extends GenericBackendRes {
    post: IPost | undefined;
}

export interface GetPostsRes extends GenericBackendRes {
    posts: IPost[];
}

export interface GetCafeteriaItemsRes extends GenericBackendRes {
    items: ICafeteriaItem[];
}

export interface GetConversationsRes extends GenericBackendRes {
    conversations: IConversation[];
}

export interface StartConversationRes extends GenericBackendRes {
    conversationId: string;
}

export interface GetMessagesRes extends GenericBackendRes {
    messages: IMessage[];
}

export interface SearchUsersRes extends GenericBackendRes {
    users: ISearchUser[];
}

export interface SearchAnnouncementsRes extends GenericBackendRes {
    announcements: ISearchAnnouncement[];
}

export interface SearchArticlesRes extends GenericBackendRes {
    articles: ISearchArticle[];
}

export interface SearchEventsRes extends GenericBackendRes {
    events: IEvent[];
}

export interface SearchJobsRes extends GenericBackendRes {
    jobs: IJob[];
}

export interface SearchAllRes extends GenericBackendRes {
    users: ISearchUser[];
    announcements: ISearchAnnouncement[];
    articles: ISearchArticle[];
    events: IEvent[];
    jobs: IJob[];
}

export interface GetJobsRes extends GenericBackendRes {
    jobs: IJob[];
}

export interface GetEventsRes extends GenericBackendRes {
    events: IEvent[];
}

export interface GetAnnouncementsRes extends GenericBackendRes {
    announcements: IAnnouncement[];
}

export interface GetAnnouncementRes extends GenericBackendRes {
    announcement: IAnnouncement;
}

export interface GetFeedRes extends GenericBackendRes {
    posts: IPost[];
}

export interface GetCommentsRes extends GenericBackendRes {
    comments: IPost[];
}

export interface GetClubMembersRes extends GenericBackendRes {
    members: IClubMember[];
}

export interface GetRecommendedMessagingPeopleRes extends GenericBackendRes {
    people: ISearchUser[];
}

export interface GetMyGroupsRes extends GenericBackendRes {
    groups: IGroup[];
}

export interface GetGroupRes extends GenericBackendRes {
    group: IGroup;
}
