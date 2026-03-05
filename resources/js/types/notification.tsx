export interface AppNotification {
    id: string;
    data: {
        message: string;
        url: string;
    };
    read_at: string | null;
    created_at: string;
}

export interface PendingUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    photo: string | null;
    created_at: string;
}