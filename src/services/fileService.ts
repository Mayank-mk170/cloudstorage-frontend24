import api from "./api";

export interface InitUploadRequest {
    fileName: string;
    contentType: string;
    size: number;
    folderId?: number | null;
}

export interface InitUploadResponse {
    fileId: number;
    uploadUrl: string;
    s3Key: string;
}

export interface CompleteUploadRequest {
    fileId: number;
}

export interface FileResponse {
    id: number;
    originalFileName: string;
    storedFileName: string;
    contentType: string;
    size: number;
    s3Key: string;
    createdAt?: string;
}

export interface SearchFilesResponse {
    content: FileResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export const getMyFiles = async (
    folderId?: number | null
): Promise<FileResponse[]> => {
    const response = await api.get<FileResponse[]>("/api/files", {
        params:
            folderId === null || folderId === undefined
                ? {}
                : { folderId },
    });

    return response.data;
};

export const initUpload = async (
    data: InitUploadRequest
): Promise<InitUploadResponse> => {
    const response = await api.post<InitUploadResponse>(
        "/api/files/init-upload",
        data
    );

    return response.data;
};

export const uploadToS3 = (
    uploadUrl: string,
    file: globalThis.File,
    onProgress?: (progress: number) => void
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
        );

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(
                    Math.round((event.loaded / event.total) * 100)
                );
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(
                    new Error(
                        `S3 upload failed with status ${xhr.status}`
                    )
                );
            }
        };

        xhr.onerror = () => reject(new Error("S3 upload failed"));
        xhr.onabort = () => reject(new Error("S3 upload cancelled"));
        xhr.send(file);
    });
};

export const completeUpload = async (
    data: CompleteUploadRequest
): Promise<unknown> => {
    const response = await api.post(
        "/api/files/complete-upload",
        data
    );

    return response.data;
};

export const getFilePreviewUrl = async (
    fileId: number
): Promise<string> => {
    const response = await api.get<string>(
        `/api/files/${fileId}/preview`
    );

    return response.data;
};

export const downloadFile = async (
    fileId: number,
    fileName: string
): Promise<void> => {
    const response = await api.get<string>(
        `/api/files/${fileId}/preview`
    );

    const link = document.createElement("a");
    link.href = response.data;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const deleteFile = async (
    fileId: number
): Promise<string> => {
    const response = await api.delete<string>(
        `/api/files/${fileId}`
    );

    return response.data;
};

export const renameFile = async (
    fileId: number,
    fileName: string
): Promise<FileResponse> => {
    const response = await api.put<FileResponse>(
        `/api/files/${fileId}`,
        { fileName }
    );

    return response.data;
};

export const searchFiles = async (
    name: string,
    page = 0,
    size = 10
): Promise<SearchFilesResponse> => {
    const response = await api.get<SearchFilesResponse>(
        "/api/files/search",
        {
            params: { name, page, size },
        }
    );

    return response.data;
};

// ==========================================
// RECYCLE BIN
// ==========================================

export const getTrashFiles = async (): Promise<
    FileResponse[] | string
> => {
    const response = await api.get<FileResponse[] | string>(
        "/api/files/trash"
    );

    return response.data;
};

export const restoreFile = async (
    fileId: number
): Promise<string> => {
    const response = await api.put<string>(
        `/api/files/${fileId}/restore`
    );

    return response.data;
};

export const permanentlyDeleteFile = async (
    fileId: number
): Promise<string> => {
    const response = await api.delete<string>(
        `/api/files/${fileId}/permanent`
    );

    return response.data;
};
