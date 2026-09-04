// import api from "./api";


// // ==========================================
// // SHARE PERMISSION
// // ==========================================

// export type SharePermission =
//     "VIEW" | "EDIT";


// // ==========================================
// // CREATE SHARE REQUEST
// // ==========================================

// export interface CreateShareRequest {

//     fileId: number;

//     email: string;

//     permission: SharePermission;

//     expiresAt?: string | null;
// }


// // ==========================================
// // SHARE RESPONSE
// // ==========================================

// export interface ShareResponse {

//     id: number;

//     fileId: number;

//     fileName: string;

//     sharedWithUserId: number;

//     sharedWithEmail: string;

//     permission: SharePermission;

//     expiresAt?: string | null;

//     createdAt: string;
// }


// // ==========================================
// // CREATE SHARE
// // ==========================================

// export const createShare = async (
//     data: CreateShareRequest
// ): Promise<ShareResponse> => {

//     const response =
//         await api.post<ShareResponse>(
//             "/api/shares",
//             data
//         );

//     return response.data;
// };


// // ==========================================
// // GET SHARES FOR FILE
// // ==========================================

// export const getSharesForFile =
//     async (
//         fileId: number
//     ): Promise<ShareResponse[]> => {

//         const response =
//             await api.get<ShareResponse[]>(
//                 `/api/shares/file/${fileId}`
//             );

//         return response.data;
//     };


// // ==========================================
// // REMOVE SHARE
// // ==========================================

// export const removeShare =
//     async (
//         shareId: number
//     ): Promise<string> => {

//         const response =
//             await api.delete<string>(
//                 `/api/shares/${shareId}`
//             );

//         return response.data;
//     };


// // ==========================================
// // GET FILES SHARED WITH ME
// // ==========================================

// export const getFilesSharedWithMe =
//     async (): Promise<ShareResponse[]> => {

//         const response =
//             await api.get<ShareResponse[]>(
//                 "/api/shares/shared-with-me"
//             );

//         return response.data;
//     };


import api from "./api";

export type SharePermission =
    "VIEW" | "EDIT";

export interface CreateShareRequest {
    fileId: number;
    email: string;
    permission: SharePermission;
    expiresAt?: string | null;
}

export interface ShareResponse {
    id: number;
    fileId: number;
    fileName: string;
    contentType: string;
    size: number;
    s3Key: string;
    sharedWithUserId: number;
    sharedWithEmail: string;
    permission: SharePermission;
    expiresAt?: string | null;
    createdAt: string;
}

export const createShare = async (
    data: CreateShareRequest
): Promise<ShareResponse> => {

    const response =
        await api.post<ShareResponse>(
            "/api/shares",
            data
        );

    return response.data;
};

export const getSharesForFile = async (
    fileId: number
): Promise<ShareResponse[]> => {

    const response =
        await api.get<ShareResponse[]>(
            `/api/shares/file/${fileId}`
        );

    return response.data;
};

export const removeShare = async (
    shareId: number
): Promise<string> => {

    const response =
        await api.delete<string>(
            `/api/shares/${shareId}`
        );

    return response.data;
};

export const getFilesSharedWithMe =
    async (): Promise<ShareResponse[]> => {

        const response =
            await api.get<ShareResponse[]>(
                "/api/shares/shared-with-me"
            );

        return response.data;
    };
