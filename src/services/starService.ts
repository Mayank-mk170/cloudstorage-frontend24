import api from "./api";

export interface StarredFile {
    id: number;

    user: {
        id: number;
        email: string;
    };

    file: {
        id: number;
        originalFileName: string;
        storedFileName: string;
        contentType: string;
        size: number;
        s3Key: string;
        createdAt?: string;
    };

    createdAt: string;
}


// ==========================================
// STAR
// ==========================================

export const starFile = async (
    fileId: number
): Promise<number> => {

    const response =
        await api.post<number>(
            `/api/stars/${fileId}`
        );

    return response.data;
};


// ==========================================
// UNSTAR
// ==========================================

export const unstarFile = async (
    fileId: number
): Promise<string> => {

    const response =
        await api.delete<string>(
            `/api/stars/${fileId}`
        );

    return response.data;
};


// ==========================================
// GET STARRED FILES
// ==========================================

export const getStarredFiles =
    async (): Promise<StarredFile[]> => {

        const response =
            await api.get<StarredFile[]>(
                "/api/stars"
            );

        return response.data;
    };