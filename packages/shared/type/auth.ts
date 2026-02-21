export interface User {
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
    display_name: string;
    avatar_url: string;
    auth_provider: string;
    google_id: string;
    updated_at: string;
    deleted_at?: string;
}

export interface JWTUser {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string;
    auth_provider: string;
    google_id: string;
}