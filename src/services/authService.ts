import api from "./api";


export interface LoginRequest {
    email: string;
    password: string;
}


export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}


export interface LoginResponse {
    token: string;
    type: string;
}


export interface User {
    id?: number;
    name: string;
    email: string;
    role?: string;
    provider?: string;
}


export const register = async (
    data: RegisterRequest
) => {

    const response = await api.post(
        "/api/v1/users/api/auth/register",
        data
    );

    return response.data;
};


export const login = async (
    data: LoginRequest
): Promise<LoginResponse> => {

    const response =
        await api.post<LoginResponse>(
            "/api/v1/users/api/auth/login",
            data
        );

    return response.data;
};


export const getCurrentUser =
    async (): Promise<User> => {

        const response =
            await api.get<User>(
                "/api/v1/users/api/auth/me"
            );

        return response.data;
    };