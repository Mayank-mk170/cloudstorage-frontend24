import api from "./api";

export interface Folder {
    id: number;
    name: string;
    parentId?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateFolderRequest {
    name: string;
    parentId?: number | null;
}

export interface RenameFolderRequest {
    name: string;
}

// ==========================================
// CREATE FOLDER
// ==========================================

export const createFolder = async (
    data: CreateFolderRequest
): Promise<Folder> => {
    const response = await api.post<Folder>(
        "/api/folders",
        data
    );

    return response.data;
};

// ==========================================
// GET ROOT FOLDERS
// ==========================================

export const getRootFolders = async (): Promise<Folder[]> => {
    const response = await api.get<Folder[]>(
        "/api/folders"
    );

    return response.data;
};

// ==========================================
// GET CHILD FOLDERS
// ==========================================

export const getChildFolders = async (
    parentId: number
): Promise<Folder[]> => {
    const response = await api.get<Folder[]>(
        `/api/folders/${parentId}/children`
    );

    return response.data;
};

// ==========================================
// RENAME FOLDER
// ==========================================

export const renameFolder = async (
    folderId: number,
    name: string
): Promise<Folder> => {
    const response = await api.put<Folder>(
        `/api/folders/${folderId}`,
        {
            name,
        }
    );

    return response.data;
};

// ==========================================
// DELETE FOLDER
// ==========================================

export const deleteFolder = async (
    folderId: number
): Promise<string> => {
    const response = await api.delete<string>(
        `/api/folders/${folderId}`
    );

    return response.data;
};

export const getTrashFolders = async (): Promise<Folder[]> => {
    const response = await api.get<Folder[]>(
        "/api/folders/trash"
    );

    return response.data;
};


export const restoreFolder = async (
    folderId: number
): Promise<string> => {

    const response = await api.put<string>(
        `/api/folders/${folderId}/restore`
    );

    return response.data;
};


export const permanentlyDeleteFolder = async (
    folderId: number
): Promise<string> => {

    const response = await api.delete<string>(
        `/api/folders/${folderId}/permanent`
    );

    return response.data;
};