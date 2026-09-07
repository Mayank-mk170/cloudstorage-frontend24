
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    getCurrentUser,
    type User,
} from "../services/authService";


import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import ShareModal from "../components/ShareModal";

import {
    createFolder,
    getChildFolders,
    getRootFolders,
    renameFolder,
    deleteFolder,
    getTrashFolders,
    restoreFolder,
    permanentlyDeleteFolder,
    type Folder,
} from "../services/folderService";

import {
    getMyFiles,
    getFilePreviewUrl,
    downloadFile,
    initUpload,
    uploadToS3,
    completeUpload,
    deleteFile,
    renameFile,
    getTrashFiles,
    restoreFile,
    permanentlyDeleteFile,
    searchFiles,
    type FileResponse,
} from "../services/fileService";

import {
    createShare,
    getFilesSharedWithMe,
} from "../services/shareService";

import {
    starFile,
    unstarFile,
    getStarredFiles,
} from "../services/starService";


function Dashboard() {

    // ==========================================
    // CURRENT USER
    // ==========================================

    const navigate = useNavigate();

    const [user, setUser] =
        useState<User | null>(null);

    const [userMenuOpen, setUserMenuOpen] =
        useState(false);

    const userMenuRef =
        useRef<HTMLDivElement | null>(null);


    // ==========================================
    // LOAD CURRENT USER
    // ==========================================

    useEffect(() => {

        const token =
            localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const loadUser = async () => {

            try {

                const currentUser =
                    await getCurrentUser();

                setUser(currentUser);

            } catch (error) {

                console.error(
                    "Unable to load current user:",
                    error
                );

                localStorage.removeItem("token");

                navigate("/login");
            }
        };

        loadUser();

    }, [navigate]);


    // ==========================================
    // CLOSE USER MENU WHEN CLICKING OUTSIDE
    // ==========================================

    useEffect(() => {

        const handleClickOutside = (
            event: MouseEvent
        ) => {

            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(
                    event.target as Node
                )
            ) {

                setUserMenuOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        localStorage.removeItem("token");

        setUserMenuOpen(false);

        setUser(null);

        navigate("/login");
    };


    // ==========================================
    // REACT QUERY
    // ==========================================

    const queryClient = useQueryClient();


    // ==========================================
    // UI STATE
    // ==========================================

    const [sidebarOpen, setSidebarOpen] =
        useState(true);

    const [createMenuOpen, setCreateMenuOpen] =
        useState(false);

    const [searchText, setSearchText] =
        useState("");

    const [searchPage, setSearchPage] =
        useState(0);
    const SEARCH_PAGE_SIZE = 10;

    // ==========================================
    // SORTING
    // ==========================================

    type SortOption =
        | "newest"
        | "oldest"
        | "name-asc"
        | "name-desc"
        | "size-asc"
        | "size-desc";

    const [sortOption, setSortOption] =
        useState<SortOption>("newest");

    // ==========================================
    // SHARE STATE
    // ==========================================

    const [shareFile, setShareFile] =
        useState<FileResponse | null>(null);

    const [openFileMenu, setOpenFileMenu] =
        useState<number | null>(null);

    // ==========================================
    // CLOSE FILE MENU WHEN CLICKING OUTSIDE
    // ==========================================

    useEffect(() => {
        const handleFileMenuClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (!target.closest("[data-file-menu]")) {
                setOpenFileMenu(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleFileMenuClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleFileMenuClickOutside
            );
        };
    }, []);

    // ==========================================
    // RENAME STATE
    // ==========================================

    const [renameFileTarget, setRenameFileTarget] =
        useState<FileResponse | null>(null);

    const [renameFileName, setRenameFileName] =
        useState("");


    // ==========================================
    // FAVORITES VIEW
    // ==========================================

    const [showFavorites, setShowFavorites] =
        useState(false);

    const [showShared, setShowShared] =
        useState(false);

    // ==========================================
    // ACTIVE SIDEBAR PAGE
    // ==========================================

    const [activePage, setActivePage] =
        useState<"home" | "myfiles" | "shared" | "favorites" | "trash">("home");

    // ==========================================
    // GLOBAL DRAG & DROP OVERLAY
    // ==========================================

    const [showDropOverlay, setShowDropOverlay] =
        useState(false);


    // ==========================================
    // FOLDER STATE
    // ==========================================

    const [folderName, setFolderName] =
        useState("");

    const [folderModalOpen, setFolderModalOpen] =
        useState(false);

    const [currentFolder, setCurrentFolder] =
        useState<Folder | null>(null);

    const [breadcrumbs, setBreadcrumbs] =
        useState<Folder[]>([]);

    // Folder share modal
    const [folderShareTarget, setFolderShareTarget] =
        useState<Folder | null>(null);

    const [folderShareEmail, setFolderShareEmail] =
        useState("");

    const [folderSharePermission, setFolderSharePermission] =
        useState<"VIEW" | "EDIT">("VIEW");


    const [openFolderMenu, setOpenFolderMenu] =
        useState<number | null>(null);

    const [renameFolderTarget, setRenameFolderTarget] =
        useState<Folder | null>(null);

    const [renameFolderName, setRenameFolderName] =
        useState("");
    // ==========================================
    // UPLOAD STATE
    // ==========================================

    const [uploadProgress, setUploadProgress] =
        useState(0);

    const [uploadingFileName, setUploadingFileName] =
        useState("");

    const [uploadError, setUploadError] =
        useState("");


    // ==========================================
    // PREVIEW STATE
    // ==========================================

    const [previewFile, setPreviewFile] =
        useState<File | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState("");

    const [storedPreviewFile, setStoredPreviewFile] =
        useState<FileResponse | null>(null);


    // ==========================================
    // REFS
    // ==========================================

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const folderInputRef =
        useRef<HTMLInputElement | null>(null);

    // Stable native drag state. Using a ref prevents dragover/dragleave
    // events from causing repeated React renders and overlay flicker.
    const dragDepthRef = useRef(0);

    // Always points to the latest drop handler while the native listeners
    // themselves are registered only once.
    const handleDropEventRef = useRef<
        ((files: File[], event: any) => Promise<void>) | null
    >(null);


    // ==========================================
    // STARRED FILES
    // ==========================================

    const starredFilesQuery = useQuery({
        queryKey: ["starredFiles"],
        queryFn: getStarredFiles,
    });


    const sharedFilesQuery = useQuery({
        queryKey: ["sharedFiles"],
        queryFn: getFilesSharedWithMe,
    });

    // ==========================================
    // RECYCLE BIN
    // ==========================================

    const trashFilesQuery = useQuery({
        queryKey: ["trashFiles"],
        queryFn: getTrashFiles,
        enabled: activePage === "trash",
    });

    const trashFoldersQuery = useQuery({
        queryKey: ["trashFolders"],
        queryFn: getTrashFolders,
        enabled: activePage === "trash",
    });

    const isTrash = activePage === "trash";


    // ==========================================
    // STAR FILE
    // ==========================================

    const starMutation = useMutation({

        mutationFn: (fileId: number) =>
            starFile(fileId),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: ["starredFiles"],
            });
        },

        onError: (error) => {

            console.error(
                "Star failed:",
                error
            );

            alert(
                "Failed to add file to favorites."
            );
        },
    });

    // search file

    const searchQuery = useQuery({
        queryKey: [
            "file-search",
            searchText,
            searchPage,
        ],

        queryFn: () =>
            searchFiles(
                searchText.trim(),
                searchPage,
                SEARCH_PAGE_SIZE
            ),

        enabled:
            searchText.trim().length > 0,
    });

    // ==========================================
    // SEARCH FOLDERS
    // ==========================================

    const searchFoldersQuery = useQuery({
        queryKey: [
            "folder-search",
            searchText,
        ],

        queryFn: async (): Promise<Folder[]> => {
            const roots = await getRootFolders();
            const allFolders: Folder[] = [];
            const visited = new Set<number>();

            const collectFolders = async (items: Folder[]) => {
                for (const folder of items) {
                    if (visited.has(folder.id)) {
                        continue;
                    }

                    visited.add(folder.id);
                    allFolders.push(folder);

                    const children = await getChildFolders(folder.id);
                    if (children.length > 0) {
                        await collectFolders(children);
                    }
                }
            };

            await collectFolders(roots);

            const term = searchText.trim().toLowerCase();

            return allFolders.filter((folder) =>
                folder.name.toLowerCase().includes(term)
            );
        },

        enabled:
            searchText.trim().length > 0,
    });

    // ==========================================
    // UNSTAR FILE
    // ==========================================

    const unstarMutation = useMutation({

        mutationFn: (fileId: number) =>
            unstarFile(fileId),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: ["starredFiles"],
            });
        },

        onError: (error) => {

            console.error(
                "Unstar failed:",
                error
            );

            alert(
                "Failed to remove file from favorites."
            );
        },
    });


    // ==========================================
    // CHECK FILE STARRED
    // ==========================================

    const isFileStarred = (
        fileId: number
    ): boolean => {

        return (
            starredFilesQuery.data?.some(
                (star) =>
                    star.file.id === fileId
            ) ?? false
        );
    };

    // ==========================================
    // FOLDER ACTION HELPERS
    // ==========================================

    const getAllFilesInFolder = async (
        folderId: number
    ): Promise<FileResponse[]> => {
        const result: FileResponse[] = [];
        const visited = new Set<number>();

        const collect = async (id: number) => {
            if (visited.has(id)) {
                return;
            }

            visited.add(id);

            const directFiles = await getMyFiles(id);
            result.push(...directFiles);

            const children = await getChildFolders(id);

            for (const child of children) {
                await collect(child.id);
            }
        };

        await collect(folderId);

        return result;
    };

    // ==========================================
    // DOWNLOAD FOLDER
    // Downloads every file inside the folder,
    // including nested folders.
    // ==========================================

    const downloadFolderMutation = useMutation({
        mutationFn: async (folder: Folder) => {
            const folderFiles =
                await getAllFilesInFolder(folder.id);

            if (folderFiles.length === 0) {
                throw new Error(
                    "This folder does not contain any files."
                );
            }

            for (const file of folderFiles) {
                await downloadFile(
                    file.id,
                    file.originalFileName
                );

                // Small delay so the browser has time
                // to process multiple downloads.
                await new Promise((resolve) =>
                    window.setTimeout(resolve, 250)
                );
            }

            return folderFiles.length;
        },

        onSuccess: (count) => {
            setOpenFolderMenu(null);
            alert(
                `Started download for ${count} file${count === 1 ? "" : "s"}.`
            );
        },

        onError: (error: any) => {
            console.error(
                "Folder download failed:",
                error
            );

            alert(
                error?.message ||
                "Failed to download folder contents."
            );
        },
    });

    // ==========================================
    // FOLDER FAVORITES
    // Folder favorites are independent from file
    // favorites. Do NOT call starFile() here.
    // ==========================================

    const [favoriteFolderIds, setFavoriteFolderIds] =
        useState<number[]>(() => {
            try {
                const saved =
                    localStorage.getItem(
                        "cloudDriveFavoriteFolders"
                    );

                if (!saved) {
                    return [];
                }

                const parsed =
                    JSON.parse(saved);

                return Array.isArray(parsed)
                    ? parsed.filter(
                        (id): id is number =>
                            typeof id === "number"
                    )
                    : [];
            } catch {
                return [];
            }
        });

    useEffect(() => {
        localStorage.setItem(
            "cloudDriveFavoriteFolders",
            JSON.stringify(favoriteFolderIds)
        );
    }, [favoriteFolderIds]);

    const isFolderFavorite = (
        folderId: number
    ): boolean =>
        favoriteFolderIds.includes(folderId);

    const toggleFolderFavoriteMutation =
        useMutation({
            mutationFn: async (
                folder: Folder
            ) => {
                const currentlyFavorite =
                    favoriteFolderIds.includes(
                        folder.id
                    );

                setFavoriteFolderIds(
                    (previous) =>
                        currentlyFavorite
                            ? previous.filter(
                                (id) =>
                                    id !== folder.id
                            )
                            : previous.includes(
                                folder.id
                            )
                                ? previous
                                : [
                                    ...previous,
                                    folder.id,
                                ]
                );

                return {
                    folder,
                    favorite:
                        !currentlyFavorite,
                };
            },

            onSuccess: () => {
                setOpenFolderMenu(null);
            },

            onError: (error) => {
                console.error(
                    "Folder favorite failed:",
                    error
                );

                alert(
                    "Failed to update folder favorite."
                );
            },
        });

    // ==========================================
    // ALL FOLDERS
    // Used only for the Favorites page so folder
    // favorites are displayed independently from
    // file favorites.
    // ==========================================

    const allFoldersQuery = useQuery({
        queryKey: ["all-folders"],
        queryFn: async (): Promise<Folder[]> => {
            const result: Folder[] = [];
            const visited = new Set<number>();

            const collect = async (
                items: Folder[]
            ) => {
                for (const folder of items) {
                    if (visited.has(folder.id)) {
                        continue;
                    }

                    visited.add(folder.id);
                    result.push(folder);

                    const children =
                        await getChildFolders(
                            folder.id
                        );

                    if (children.length > 0) {
                        await collect(children);
                    }
                }
            };

            const roots =
                await getRootFolders();

            await collect(roots);

            return result;
        },
    });

    const favoriteFolders =
        allFoldersQuery.data?.filter(
            (folder) =>
                favoriteFolderIds.includes(
                    folder.id
                )
        ) ?? [];

    // ==========================================
    // SHARE FOLDER
    // Shares all files currently inside the
    // folder using the existing file-share API.
    // ==========================================

    const shareFolderMutation = useMutation({
        mutationFn: async ({
            folder,
            email,
            permission,
        }: {
            folder: Folder;
            email: string;
            permission: "VIEW" | "EDIT";
        }) => {
            const folderFiles =
                await getAllFilesInFolder(folder.id);

            if (folderFiles.length === 0) {
                throw new Error(
                    "This folder does not contain any files to share."
                );
            }

            let shared = 0;
            let alreadyShared = 0;

            for (const file of folderFiles) {
                try {
                    await createShare({
                        fileId: file.id,
                        email,
                        permission,
                        expiresAt: null,
                    });

                    shared++;
                } catch (error: any) {
                    const message =
                        error?.response?.data;

                    if (
                        typeof message === "string" &&
                        message.toLowerCase().includes("already shared")
                    ) {
                        alreadyShared++;
                        continue;
                    }

                    throw error;
                }
            }

            return {
                total: folderFiles.length,
                shared,
                alreadyShared,
            };
        },

        onSuccess: () => {
            setOpenFolderMenu(null);
            setFolderShareTarget(null);
            setFolderShareEmail("");
            setFolderSharePermission("VIEW");

            queryClient.invalidateQueries({
                queryKey: ["sharedFiles"],
            });
        },

        onError: (error: any) => {
            console.error(
                "Folder sharing failed:",
                error
            );

            const message =
                error?.response?.data ||
                error?.message ||
                "Failed to share folder.";

            alert(
                typeof message === "string"
                    ? message
                    : "Failed to share folder."
            );
        },
    });



    // ==========================================
    // OPEN STORED FILE PREVIEW
    // ==========================================

    const openStoredFilePreview = async (
        file: FileResponse
    ) => {

        const isImage =
            file.contentType.startsWith("image/");

        const isPdf =
            file.contentType ===
            "application/pdf";


        // Only preview images and PDFs

        if (!isImage && !isPdf) {
            return;
        }


        try {

            setUploadError("");

            const url =
                await getFilePreviewUrl(
                    file.id
                );

            setStoredPreviewFile(file);

            setPreviewUrl(url);

        } catch (error) {

            console.error(
                "Failed to open file preview:",
                error
            );

            setUploadError(
                "Unable to open file preview."
            );
        }
    };


    // folder  

    const renameFolderMutation = useMutation({
        mutationFn: async ({
            folderId,
            name,
        }: {
            folderId: number;
            name: string;
        }) =>
            renameFolder(folderId, name),

        onSuccess: () => {
            setRenameFolderTarget(null);
            setRenameFolderName("");
            setOpenFolderMenu(null);

            queryClient.invalidateQueries({
                queryKey: ["root-folders"],
            });

            queryClient.invalidateQueries({
                queryKey: ["child-folders"],
            });
        },

        onError: (error) => {
            console.error(
                "Folder rename failed:",
                error
            );

            alert("Failed to rename folder.");
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: async (folderId: number) =>
            deleteFolder(folderId),

        onSuccess: () => {
            setOpenFolderMenu(null);

            queryClient.invalidateQueries({
                queryKey: ["root-folders"],
            });

            queryClient.invalidateQueries({
                queryKey: ["child-folders"],
            });

            queryClient.invalidateQueries({
                queryKey: ["trashFolders"],
            });
        },

        onError: (error: any) => {
            console.error(
                "Folder delete failed:",
                error
            );

            const message =
                error?.response?.data ||
                "Failed to delete folder.";

            alert(message);
        },
    });

    // ==========================================
    // ROOT FOLDERS
    // ==========================================

    const {
        data: rootFolders = [],
        isLoading: rootFoldersLoading,
        isError: rootFoldersError,
    } = useQuery({

        queryKey: [
            "root-folders",
        ],

        queryFn:
            getRootFolders,
    });


    // ==========================================
    // CHILD FOLDERS
    // ==========================================

    const {
        data: childFolders = [],
        isLoading: childFoldersLoading,
        isError: childFoldersError,
    } = useQuery({

        queryKey: [
            "child-folders",
            currentFolder?.id,
        ],

        queryFn: () =>
            getChildFolders(
                currentFolder!.id
            ),

        enabled:
            currentFolder !== null,
    });


    // ==========================================
    // FILES
    // ==========================================

    const {
        data: files = [],
        isLoading: filesLoading,
        isError: filesError,
    } = useQuery<FileResponse[]>({

        queryKey: [
            "files",
            currentFolder?.id ?? null,
        ],

        queryFn: () =>
            getMyFiles(
                currentFolder?.id ?? null
            ),
    });


    // ==========================================
    // CREATE FOLDER
    // ==========================================

    const createFolderMutation =
        useMutation({

            mutationFn:
                createFolder,

            onSuccess: () => {

                setFolderName("");

                setFolderModalOpen(
                    false
                );

                setCreateMenuOpen(
                    false
                );


                if (currentFolder) {

                    queryClient.invalidateQueries({
                        queryKey: [
                            "child-folders",
                            currentFolder.id,
                        ],
                    });

                } else {

                    queryClient.invalidateQueries({
                        queryKey: [
                            "root-folders",
                        ],
                    });
                }
            },

            onError: (error) => {

                console.error(
                    "Folder creation failed:",
                    error
                );

                alert(
                    "Failed to create folder"
                );
            },
        });


    // ==========================================
    // DOWNLOAD FILE
    // ==========================================

    const downloadFileMutation =
        useMutation({

            mutationFn: async ({
                fileId,
                fileName,
            }: {
                fileId: number;
                fileName: string;
            }) => {

                await downloadFile(
                    fileId,
                    fileName
                );
            },

            onSuccess: () => {

                setOpenFileMenu(null);
            },

            onError: (error) => {

                console.error(
                    "Download failed:",
                    error
                );

                alert(
                    "Failed to download file."
                );
            },
        });


    // ==========================================
    // DELETE FILE
    // ==========================================

    const deleteFileMutation =
        useMutation({

            mutationFn: deleteFile,

            onSuccess: () => {

                setOpenFileMenu(null);

                queryClient.invalidateQueries({
                    queryKey: [
                        "files",
                    ],
                });

                queryClient.invalidateQueries({
                    queryKey: [
                        "starredFiles",
                    ],
                });

                queryClient.invalidateQueries({
                    queryKey: [
                        "trashFiles",
                    ],
                });
            },

            onError: (error) => {

                console.error(
                    "Delete failed:",
                    error
                );

                alert(
                    "Failed to delete file."
                );
            },
        });


    // ==========================================
    // RESTORE FILE FROM TRASH
    // ==========================================

    const restoreFileMutation =
        useMutation({
            mutationFn: restoreFile,

            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["trashFiles"],
                });

                queryClient.invalidateQueries({
                    queryKey: ["files"],
                });
            },

            onError: (error) => {
                console.error("Restore failed:", error);
                alert("Failed to restore file.");
            },
        });


    // ==========================================
    // PERMANENTLY DELETE FILE
    // ==========================================

    const permanentlyDeleteFileMutation =
        useMutation({
            mutationFn: permanentlyDeleteFile,

            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["trashFiles"],
                });

                queryClient.invalidateQueries({
                    queryKey: ["starredFiles"],
                });
            },

            onError: (error) => {
                console.error("Permanent delete failed:", error);
                alert("Failed to permanently delete file.");
            },
        });


    // ==========================================
    // RESTORE FOLDER FROM TRASH
    // ==========================================

    const restoreFolderMutation = useMutation({
        mutationFn: restoreFolder,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trashFolders"] });
            queryClient.invalidateQueries({ queryKey: ["root-folders"] });
            queryClient.invalidateQueries({ queryKey: ["child-folders"] });
        },

        onError: (error) => {
            console.error("Folder restore failed:", error);
            alert("Failed to restore folder.");
        },
    });

    // ==========================================
    // PERMANENTLY DELETE FOLDER
    // ==========================================

    const permanentlyDeleteFolderMutation = useMutation({
        mutationFn: permanentlyDeleteFolder,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trashFolders"] });
        },

        onError: (error) => {
            console.error("Folder permanent delete failed:", error);
            alert("Failed to permanently delete folder.");
        },
    });


    // ==========================================
    // RENAME FILE
    // ==========================================

    const renameFileMutation =
        useMutation({

            mutationFn: ({
                fileId,
                fileName,
            }: {
                fileId: number;
                fileName: string;
            }) =>
                renameFile(
                    fileId,
                    fileName
                ),

            onSuccess: () => {

                setRenameFileTarget(null);

                setRenameFileName("");

                setOpenFileMenu(null);

                queryClient.invalidateQueries({
                    queryKey: ["files"],
                });

                queryClient.invalidateQueries({
                    queryKey: ["starredFiles"],
                });

                queryClient.invalidateQueries({
                    queryKey: ["sharedFiles"],
                });
            },

            onError: (error) => {

                console.error(
                    "Rename failed:",
                    error
                );

                alert(
                    "Failed to rename file."
                );
            },
        });


    // ==========================================
    // SINGLE FILE UPLOAD
    // ==========================================

    const uploadFileMutation =
        useMutation({

            mutationFn:
                async (file: File) => {

                    setUploadError("");

                    setUploadProgress(
                        0
                    );

                    setUploadingFileName(
                        file.name
                    );


                    // ======================================
                    // STEP 1: INIT UPLOAD
                    // ======================================

                    const initResponse = await initUpload({
                        fileName: file.name,
                        contentType:
                            file.type ||
                            "application/octet-stream",
                        size: file.size,
                        folderId: currentFolder?.id ?? null,
                    });

                    // ======================================
                    // STEP 2: UPLOAD TO S3
                    // ======================================

                    await uploadToS3(

                        initResponse.uploadUrl,

                        file,

                        (progress) => {

                            setUploadProgress(
                                progress
                            );
                        }
                    );


                    // ======================================
                    // STEP 3: COMPLETE UPLOAD
                    // ======================================

                    return await completeUpload({
                        fileId:
                            initResponse.fileId,
                    });
                },


            onSuccess: () => {

                setUploadProgress(
                    100
                );

                queryClient.invalidateQueries({
                    queryKey: [
                        "files",
                    ],
                });
            },


            onError: (error) => {

                console.error(
                    "File upload failed:",
                    error
                );

                setUploadError(
                    error instanceof Error
                        ? error.message
                        : "File upload failed"
                );

                setUploadProgress(
                    0
                );

                setUploadingFileName(
                    ""
                );
            },
        });


    // ==========================================
    // UPLOAD MULTIPLE FILES
    // ==========================================

    const uploadFiles = async (
        selectedFiles: File[]
    ) => {

        setUploadError("");


        if (
            selectedFiles.length ===
            0
        ) {

            return;
        }


        for (
            const file of selectedFiles
        ) {

            try {

                await uploadFileMutation
                    .mutateAsync(file);

            } catch (error) {

                console.error(
                    "Upload failed:",
                    error
                );

                setUploadError(
                    error instanceof Error
                        ? error.message
                        : "File upload failed"
                );

                break;
            }
        }


        setTimeout(() => {

            setUploadProgress(
                0
            );

            setUploadingFileName(
                ""
            );

        }, 1200);
    };


    // ==========================================
    // UPLOAD A FILE INTO A SPECIFIC FOLDER
    // ==========================================

    const uploadFileToFolder = async (
        file: File,
        folderId: number
    ) => {
        setUploadingFileName(file.name);
        setUploadProgress(0);

        const initResponse = await initUpload({
            fileName: file.name,
            contentType:
                file.type ||
                "application/octet-stream",
            size: file.size,
            folderId,
        });

        await uploadToS3(
            initResponse.uploadUrl,
            file,
            (progress) => {
                setUploadProgress(progress);
            }
        );

        await completeUpload({
            fileId: initResponse.fileId,
        });
    };


    // ==========================================
    // GET EXISTING FOLDER OR CREATE IT
    // ==========================================

    const getOrCreateFolder = async (
        name: string,
        parentId: number | null
    ): Promise<Folder> => {
        const folders = parentId === null
            ? await getRootFolders()
            : await getChildFolders(parentId);

        const existing = folders.find(
            (folder) =>
                folder.name.trim().toLowerCase() ===
                name.trim().toLowerCase()
        );

        if (existing) {
            return existing;
        }

        return await createFolder({
            name: name.trim(),
            parentId,
        });
    };


    // ==========================================
    // UPLOAD DIRECTORY HANDLE
    //
    // Recursively creates the selected folder structure and
    // uploads every file type into the correct cloud folder.
    // Empty folders are also preserved.
    // ==========================================

    const uploadDirectoryHandle = async (
        directoryHandle: any,
        parentFolderId: number | null
    ) => {
        try {
            setUploadError("");
            setUploadProgress(0);
            setUploadingFileName(`Creating folder: ${directoryHandle.name}`);

            const rootFolder = await getOrCreateFolder(
                directoryHandle.name,
                parentFolderId
            );

            let totalFiles = 0;
            let uploadedFiles = 0;

            const countFiles = async (dirHandle: any): Promise<number> => {
                let count = 0;

                for await (const entry of dirHandle.values()) {
                    if (entry.kind === "file") {
                        count += 1;
                    } else if (entry.kind === "directory") {
                        count += await countFiles(entry);
                    }
                }

                return count;
            };

            totalFiles = await countFiles(directoryHandle);

            const processDirectory = async (
                dirHandle: any,
                cloudFolderId: number
            ): Promise<void> => {
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === "directory") {
                        setUploadingFileName(`Creating folder: ${entry.name}`);

                        const childFolder = await getOrCreateFolder(
                            entry.name,
                            cloudFolderId
                        );

                        await processDirectory(entry, childFolder.id);
                        continue;
                    }

                    if (entry.kind === "file") {
                        const file = await entry.getFile();
                        uploadedFiles += 1;

                        setUploadingFileName(file.name);

                        console.log(`Uploading ${uploadedFiles}/${totalFiles}:`, {
                            name: file.name,
                            type: file.type || "application/octet-stream",
                            size: file.size,
                        });

                        // Use the specific cloud folder ID so nested files
                        // never get uploaded into the wrong folder.
                        await uploadFileToFolder(file, cloudFolderId);

                        setUploadProgress(
                            totalFiles > 0
                                ? Math.round((uploadedFiles / totalFiles) * 100)
                                : 100
                        );
                    }
                }
            };

            await processDirectory(directoryHandle, rootFolder.id);

            setUploadProgress(100);
            setUploadingFileName(
                totalFiles === 0
                    ? `Folder "${directoryHandle.name}" created`
                    : `Uploaded ${uploadedFiles} file${uploadedFiles === 1 ? "" : "s"}`
            );

            await queryClient.invalidateQueries({ queryKey: ["root-folders"] });
            await queryClient.invalidateQueries({ queryKey: ["child-folders"] });
            await queryClient.invalidateQueries({
                queryKey: ["files", parentFolderId],
            });
        } catch (error: any) {
            console.error("Folder upload failed:", error);
            setUploadError(error?.message || "Failed to upload folder.");
            setUploadProgress(0);
            setUploadingFileName("");
        }
    };

    // ==========================================
    // UPLOAD DIRECTORY ENTRY FROM DRAG & DROP
    //
    // webkitGetAsEntry() gives us the directory itself,
    // including an empty directory. We create the folder
    // before reading its children.
    // ==========================================

    const uploadDirectoryEntry = useCallback(
        async (
            entry: FileSystemDirectoryEntry,
            parentId: number | null
        ): Promise<Folder> => {
            setUploadError("");
            setUploadingFileName(`Creating folder: ${entry.name}`);
            setUploadProgress(0);

            const cloudFolder = await getOrCreateFolder(
                entry.name,
                parentId
            );

            const reader = entry.createReader();

            const readEntries = (): Promise<FileSystemEntry[]> =>
                new Promise((resolve, reject) => {
                    reader.readEntries(resolve, reject);
                });

            while (true) {
                const entries = await readEntries();

                if (entries.length === 0) {
                    break;
                }

                for (const child of entries) {
                    if (child.isDirectory) {
                        await uploadDirectoryEntry(
                            child as FileSystemDirectoryEntry,
                            cloudFolder.id
                        );
                        continue;
                    }

                    if (child.isFile) {
                        const file = await new Promise<File>(
                            (resolve, reject) => {
                                (child as FileSystemFileEntry).file(
                                    resolve,
                                    reject
                                );
                            }
                        );

                        setUploadingFileName(file.name);
                        await uploadFileToFolder(
                            file,
                            cloudFolder.id
                        );
                    }
                }
            }

            return cloudFolder;
        },
        [getOrCreateFolder]
    );


    // ==========================================
    // FALLBACK: UPLOAD A webkitdirectory FILE LIST
    //
    // Used only when showDirectoryPicker() is unavailable.
    // This preserves nested folders when files exist.
    // An actually empty folder cannot be represented by a
    // FileList, so modern Chrome uses showDirectoryPicker().
    // ==========================================

    const uploadFolderFileList = async (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) {
            throw new Error(
                "Your browser did not return any files from the selected folder."
            );
        }

        setUploadError("");
        setUploadProgress(0);

        const firstPath =
            selectedFiles[0].webkitRelativePath || selectedFiles[0].name;
        const firstParts = firstPath.split("/");
        const rootName =
            firstParts.length > 1 ? firstParts[0] : selectedFiles[0].name;

        const rootFolder = await getOrCreateFolder(
            rootName,
            currentFolder?.id ?? null
        );

        const folderCache = new Map<string, Folder>();
        folderCache.set(rootName, rootFolder);

        const totalFiles = selectedFiles.length;
        let uploadedFiles = 0;

        for (const file of selectedFiles) {
            const relativePath = file.webkitRelativePath || file.name;
            const pathParts = relativePath.split("/");

            let parentFolder = rootFolder;
            let currentPath = rootName;

            for (
                let index = 1;
                index < pathParts.length - 1;
                index += 1
            ) {
                const folderName = pathParts[index];
                currentPath = `${currentPath}/${folderName}`;

                let childFolder = folderCache.get(currentPath);

                if (!childFolder) {
                    childFolder = await getOrCreateFolder(
                        folderName,
                        parentFolder.id
                    );
                    folderCache.set(currentPath, childFolder);
                }

                parentFolder = childFolder;
            }

            setUploadingFileName(relativePath);
            await uploadFileToFolder(file, parentFolder.id);

            uploadedFiles += 1;
            setUploadProgress(
                Math.round((uploadedFiles / totalFiles) * 100)
            );
        }

        return rootFolder;
    };

    // ==========================================
    // OPEN FILE PICKER
    // ==========================================

    const openFilePicker = () => {
        setCreateMenuOpen(false);
        setUploadError("");

        requestAnimationFrame(() => {
            fileInputRef.current?.click();
        });
    };


    // ==========================================
    // OPEN FOLDER PICKER
    //
    // FIRST CHOICE: File System Access API.
    // This is required for true empty-folder support.
    // It returns a DirectoryHandle even when the folder
    // contains no files.
    // ==========================================

    const openFolderPicker = async () => {
        setCreateMenuOpen(false);
        setUploadError("");

        const picker = (window as any).showDirectoryPicker;

        // Preferred method for Chrome/Edge. This supports real folders,
        // nested folders, files of any type, and empty folders.
        if (typeof picker === "function") {
            try {
                const directoryHandle = await picker.call(window, {
                    mode: "read",
                });

                await uploadDirectoryHandle(
                    directoryHandle,
                    currentFolder?.id ?? null
                );

                return;
            } catch (error: any) {
                if (error?.name === "AbortError") {
                    return;
                }

                console.error("Directory picker upload failed:", error);
                setUploadError(error?.message || "Failed to upload folder.");
                setUploadProgress(0);
                setUploadingFileName("");
                return;
            }
        }

        // Fallback for browsers without showDirectoryPicker().
        requestAnimationFrame(() => {
            folderInputRef.current?.click();
        });
    };

    // ==========================================
    // HANDLE FILE SELECT
    // ==========================================

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles = Array.from(
            event.target.files ?? []
        );

        if (selectedFiles.length === 0) {
            return;
        }

        void uploadFiles(selectedFiles);

        // Allow selecting the same file again later
        event.target.value = "";
    };


    // ==========================================
    // HANDLE FOLDER SELECT - FALLBACK ONLY
    // ==========================================

    const handleFolderSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        if (selectedFiles.length === 0) {
            setUploadError("No files were found in the selected folder.");
            event.target.value = "";
            return;
        }

        console.log(
            "Folder files:",
            selectedFiles.map((file) => ({
                name: file.name,
                path: file.webkitRelativePath,
                type: file.type || "application/octet-stream",
                size: file.size,
            }))
        );

        void uploadFolderFileList(selectedFiles)
            .then(async () => {
                await queryClient.invalidateQueries({
                    queryKey: ["root-folders"],
                });
                await queryClient.invalidateQueries({
                    queryKey: ["child-folders"],
                });
                await queryClient.invalidateQueries({
                    queryKey: ["files", currentFolder?.id ?? null],
                });

                setUploadProgress(100);
                setUploadingFileName("");
            })
            .catch((error: any) => {
                console.error("Fallback folder upload failed:", error);
                setUploadError(
                    error?.message || "Failed to upload folder."
                );
                setUploadProgress(0);
                setUploadingFileName("");
            });

        // Allow selecting the same folder again.
        event.target.value = "";
    };

    // ==========================================
    // HANDLE NATIVE DRAG & DROP
    //
    // Do not convert a dropped folder into a File.
    // Read the DataTransferItem as a directory entry/handle.
    // ==========================================

    const handleDropEvent = async (
        acceptedFiles: File[],
        event: any
    ) => {
        const dataTransfer =
            event?.dataTransfer as DataTransfer | undefined;

        if (!dataTransfer) {
            if (acceptedFiles.length > 0) {
                await uploadFiles(acceptedFiles);
            }
            return;
        }

        const items = Array.from(
            dataTransfer.items ?? []
        );

        // Prefer the modern File System Access API for dropped directories.
        for (const item of items) {
            const getHandle =
                (item as any).getAsFileSystemHandle;

            if (typeof getHandle !== "function") {
                continue;
            }

            try {
                const handle = await getHandle.call(item);

                if (!handle) {
                    continue;
                }

                if (handle.kind === "directory") {
                    await uploadDirectoryHandle(
                        handle,
                        currentFolder?.id ?? null
                    );
                } else if (handle.kind === "file") {
                    const file = await handle.getFile();
                    await uploadFiles([file]);
                }
            } catch (error) {
                console.error(
                    "Modern drag-and-drop item failed:",
                    error
                );
            }
        }

        // If at least one item exposed getAsFileSystemHandle,
        // it was handled above.
        const hasModernHandle = items.some(
            (item) =>
                typeof (item as any).getAsFileSystemHandle ===
                "function"
        );

        if (hasModernHandle) {
            await queryClient.invalidateQueries({
                queryKey: ["root-folders"],
            });
            await queryClient.invalidateQueries({
                queryKey: ["child-folders"],
            });
            await queryClient.invalidateQueries({
                queryKey: [
                    "files",
                    currentFolder?.id ?? null,
                ],
            });
            return;
        }

        // Fallback for Chromium's older FileSystemEntry API.
        let handledDirectory = false;

        for (const item of items) {
            const getEntry =
                (item as any).webkitGetAsEntry;

            if (typeof getEntry !== "function") {
                continue;
            }

            const entry = getEntry.call(item) as FileSystemEntry | null;

            if (!entry) {
                continue;
            }

            if (entry.isDirectory) {
                handledDirectory = true;

                try {
                    await uploadDirectoryEntry(
                        entry as FileSystemDirectoryEntry,
                        currentFolder?.id ?? null
                    );
                } catch (error: any) {
                    console.error(
                        "Directory drag-and-drop failed:",
                        error
                    );
                    setUploadError(
                        error?.message ||
                        "Folder drag-and-drop failed."
                    );
                }
            } else if (entry.isFile) {
                const file = await new Promise<File>(
                    (resolve, reject) => {
                        (entry as FileSystemFileEntry).file(
                            resolve,
                            reject
                        );
                    }
                );

                await uploadFiles([file]);
            }
        }

        if (handledDirectory || acceptedFiles.length > 0) {
            await queryClient.invalidateQueries({
                queryKey: ["root-folders"],
            });
            await queryClient.invalidateQueries({
                queryKey: ["child-folders"],
            });
            await queryClient.invalidateQueries({
                queryKey: [
                    "files",
                    currentFolder?.id ?? null,
                ],
            });
        }
    };


    // ==========================================
    // KEEP THE LATEST DROP HANDLER AVAILABLE TO
    // THE STABLE NATIVE EVENT LISTENERS
    // ==========================================

    handleDropEventRef.current = handleDropEvent;


    // ==========================================
    // NATIVE DROP HANDLER
    // ==========================================

    const handleNativeDrop = (
        event: DragEvent
    ) => {
        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current = 0;
        setShowDropOverlay(false);

        const dropHandler = handleDropEventRef.current;

        if (!dropHandler) {
            return;
        }

        void dropHandler(
            Array.from(event.dataTransfer?.files ?? []),
            event
        ).finally(() => {
            setUploadProgress(0);
            setUploadingFileName("");
        });
    };


    // ==========================================
    // GLOBAL DRAG & DROP
    //
    // IMPORTANT: dragover fires continuously.
    // Never call setShowDropOverlay() from dragover.
    // A ref-based depth counter prevents flicker when
    // the dragged item crosses child elements.
    // ==========================================

    useEffect(() => {

        const hasFiles = (event: DragEvent) =>
            Array.from(
                event.dataTransfer?.types ?? []
            ).includes("Files");


        const handleDragEnter = (event: DragEvent) => {

            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();

            dragDepthRef.current += 1;

            if (dragDepthRef.current === 1) {
                setShowDropOverlay(true);
            }
        };


        const handleDragOver = (event: DragEvent) => {

            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "copy";
            }

            // DO NOT update React state here.
            // dragover fires many times per second.
        };


        const handleDragLeave = (event: DragEvent) => {

            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();

            dragDepthRef.current = Math.max(
                0,
                dragDepthRef.current - 1
            );

            if (dragDepthRef.current === 0) {
                setShowDropOverlay(false);
            }
        };


        const handleWindowDrop = (event: DragEvent) => {

            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            dragDepthRef.current = 0;
            setShowDropOverlay(false);

            const dropHandler = handleDropEventRef.current;

            if (!dropHandler) {
                return;
            }

            void dropHandler(
                Array.from(event.dataTransfer?.files ?? []),
                event
            ).finally(() => {
                setUploadProgress(0);
                setUploadingFileName("");
            });
        };


        window.addEventListener(
            "dragenter",
            handleDragEnter
        );

        window.addEventListener(
            "dragover",
            handleDragOver
        );

        window.addEventListener(
            "dragleave",
            handleDragLeave
        );

        window.addEventListener(
            "drop",
            handleWindowDrop
        );


        return () => {

            window.removeEventListener(
                "dragenter",
                handleDragEnter
            );

            window.removeEventListener(
                "dragover",
                handleDragOver
            );

            window.removeEventListener(
                "dragleave",
                handleDragLeave
            );

            window.removeEventListener(
                "drop",
                handleWindowDrop
            );

            dragDepthRef.current = 0;
        };

    }, []);


    // ==========================================
    // OPEN FOLDER
    // ==========================================

    const openFolder = (
        folder: Folder
    ) => {

        setActivePage("myfiles");

        setShowFavorites(false);

        setShowShared(false);

        setCurrentFolder(
            folder
        );

        setBreadcrumbs(
            previous => [
                ...previous,
                folder,
            ]
        );
    };


    // ==========================================
    // GO TO ROOT
    // ==========================================

    const goToRoot = () => {

        setActivePage("home");

        setShowFavorites(false);

        setShowShared(false);

        setCurrentFolder(null);

        setBreadcrumbs([]);

        setOpenFileMenu(null);
    };


    // ==========================================
    // SHOW MY FILES
    // ==========================================

    const openMyFiles = () => {

        setActivePage("myfiles");

        setShowFavorites(false);

        setShowShared(false);

        setCurrentFolder(null);

        setBreadcrumbs([]);

        setOpenFileMenu(null);
    };


    // ==========================================
    // GO TO BREADCRUMB
    // ==========================================

    const goToBreadcrumb = (
        index: number
    ) => {

        const selectedFolder =
            breadcrumbs[index];


        setActivePage("home");

        setShowFavorites(false);

        setShowShared(false);

        setCurrentFolder(
            selectedFolder
        );


        setBreadcrumbs(
            breadcrumbs.slice(
                0,
                index + 1
            )
        );
    };


    // ==========================================
    // SHOW RECYCLE BIN
    // ==========================================

    const openTrash = () => {
        setActivePage("trash");
        setShowFavorites(false);
        setShowShared(false);
        setCurrentFolder(null);
        setBreadcrumbs([]);
        setOpenFileMenu(null);
        setSearchText("");
        setSearchPage(0);
    };


    // ==========================================
    // SHOW FAVORITES
    // ==========================================

    const openFavorites = () => {

        setActivePage("favorites");

        setShowFavorites(true);

        setShowShared(false);

        setCurrentFolder(null);

        setBreadcrumbs([]);

        setOpenFileMenu(null);
    };


    // ==========================================
    // SHOW SHARED
    // ==========================================

    const openShared = () => {

        setActivePage("shared");

        setShowShared(true);

        setShowFavorites(false);

        setCurrentFolder(null);

        setBreadcrumbs([]);

        setOpenFileMenu(null);
    };

    // ==========================================
    // CURRENT FOLDERS
    // ==========================================

    const folders =
        currentFolder
            ? childFolders
            : rootFolders;


    const foldersLoading =
        currentFolder
            ? childFoldersLoading
            : rootFoldersLoading;


    const foldersError =
        currentFolder
            ? childFoldersError
            : rootFoldersError;


    // ==========================================
    // DISPLAY FILES
    // ==========================================

    const isSearching =
        searchText.trim().length > 0;

    const baseDisplayedFiles: FileResponse[] =
        showShared
            ? (
                sharedFilesQuery.data
                    ?.map(
                        (share) => ({
                            id: share.fileId,
                            originalFileName: share.fileName,
                            storedFileName: "",
                            contentType:
                                share.contentType ??
                                "application/octet-stream",
                            size: share.size ?? 0,
                            s3Key: share.s3Key ?? "",
                            createdAt: share.createdAt,
                        })
                    )
                ?? []
            )
            : showFavorites
                ? (
                    starredFilesQuery.data
                        ?.map((star) => star.file)
                    ?? []
                )
                : files;

    const displayedFiles: FileResponse[] =
        isSearching &&
            !showShared &&
            !showFavorites
            ? searchQuery.data?.content ?? []
            : baseDisplayedFiles;

    const searchedFolders: Folder[] =
        isSearching &&
            !showShared &&
            !showFavorites
            ? searchFoldersQuery.data ?? []
            : [];

    // ==========================================
    // SORTED RESULTS
    // ==========================================

    const sortedDisplayedFiles = [
        ...displayedFiles,
    ].sort((a, b) => {
        const nameA = a.originalFileName.toLowerCase();
        const nameB = b.originalFileName.toLowerCase();

        switch (sortOption) {
            case "name-asc":
                return nameA.localeCompare(nameB);

            case "name-desc":
                return nameB.localeCompare(nameA);

            case "size-asc":
                return (a.size ?? 0) - (b.size ?? 0);

            case "size-desc":
                return (b.size ?? 0) - (a.size ?? 0);

            case "oldest":
                return (
                    new Date(a.createdAt ?? 0).getTime() -
                    new Date(b.createdAt ?? 0).getTime()
                );

            case "newest":
            default:
                return (
                    new Date(b.createdAt ?? 0).getTime() -
                    new Date(a.createdAt ?? 0).getTime()
                );
        }
    });

    const sortFolders = (items: Folder[]) =>
        [...items].sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (sortOption === "name-desc") {
                return nameB.localeCompare(nameA);
            }

            if (sortOption === "oldest" || sortOption === "newest") {
                const dateA = new Date(
                    (a as Folder & { createdAt?: string }).createdAt ?? 0
                ).getTime();
                const dateB = new Date(
                    (b as Folder & { createdAt?: string }).createdAt ?? 0
                ).getTime();

                return sortOption === "oldest"
                    ? dateA - dateB
                    : dateB - dateA;
            }

            return nameA.localeCompare(nameB);
        });

    const sortedFolders = sortFolders(folders);
    const sortedSearchedFolders =
        sortFolders(searchedFolders);

    // ==========================================
    // FILE SIZE
    // ==========================================

    const formatFileSize = (
        bytes?: number | null
    ) => {

        const safeBytes =
            bytes ?? 0;

        if (
            safeBytes === 0
        ) {

            return "0 Bytes";
        }


        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB",
        ];


        const index =
            Math.floor(
                Math.log(safeBytes) /
                Math.log(1024)
            );


        return `${(
            safeBytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(
            index === 0
                ? 0
                : 2
        )} ${units[index]
            }`;
    };


    // ==========================================
    // FILE ICON
    // ==========================================

    const getFileIcon = (
        contentType?: string | null
    ) => {

        const type =
            contentType?.toLowerCase() ?? "";


        if (
            type.startsWith(
                "image/"
            )
        ) {

            return "🖼️";
        }


        if (
            type.startsWith(
                "video/"
            )
        ) {

            return "🎬";
        }


        if (
            type.startsWith(
                "audio/"
            )
        ) {

            return "🎵";
        }


        if (
            type.includes(
                "pdf"
            )
        ) {

            return "📕";
        }


        if (
            type.includes(
                "word"
            ) ||
            type.includes(
                "document"
            )
        ) {

            return "📘";
        }


        if (
            type.includes(
                "sheet"
            ) ||
            type.includes(
                "excel"
            )
        ) {

            return "📗";
        }


        if (
            type.includes(
                "zip"
            ) ||
            type.includes(
                "compressed"
            )
        ) {

            return "🗜️";
        }


        return "📄";
    };


    // ==========================================
    // CLOSE PREVIEW
    // ==========================================

    const closePreview = () => {

        setPreviewFile(
            null
        );

        setStoredPreviewFile(
            null
        );

        setPreviewUrl(
            ""
        );
    };


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="flex min-h-screen bg-gray-50">


            {/* ===================================== */}
            {/* SIDEBAR */}
            {/* ===================================== */}

            <aside
                className={`border-r border-gray-200 bg-white transition-all duration-200 ${sidebarOpen
                    ? "w-64"
                    : "w-0 overflow-hidden"
                    }`}
            >

                <div className="p-4">


                    {/* CREATE / UPLOAD */}

                    <div className="relative mb-6">

                        <button
                            type="button"
                            onClick={() =>
                                setCreateMenuOpen(
                                    !createMenuOpen
                                )
                            }
                            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
                        >

                            <span className="text-xl">
                                +
                            </span>

                            Create or upload

                        </button>


                        {createMenuOpen && (

                            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">


                                {/* NEW FOLDER */}

                                <button
                                    type="button"
                                    onClick={() => {

                                        setCreateMenuOpen(
                                            false
                                        );

                                        setFolderModalOpen(
                                            true
                                        );
                                    }}
                                    className="cursor-pointer flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >

                                    <span>
                                        📁
                                    </span>

                                    New folder

                                </button>


                                {/* UPLOAD FILES */}

                                <button
                                    type="button"
                                    onClick={openFilePicker}
                                    disabled={uploadFileMutation.isPending}
                                    className="cursor-pointer flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span>📄</span>
                                    <span>Upload files</span>
                                </button>


                                {/* UPLOAD FOLDER */}

                                <button
                                    type="button"
                                    onClick={openFolderPicker}
                                    disabled={uploadFileMutation.isPending}
                                    className="cursor-pointer flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span>📁</span>
                                    <span>Upload folder</span>
                                </button>

                            </div>
                        )}

                    </div>


                    {/* NAVIGATION */}

                    <nav className="space-y-1">


                        {/* HOME */}

                        <button
                            type="button"
                            onClick={
                                goToRoot
                            }
                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${activePage === "home" &&
                                currentFolder === null
                                ? "bg-blue-50 font-medium text-blue-700"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >

                            <span>
                                🏠
                            </span>

                            Home

                        </button>


                        {/* MY FILES */}

                        <button
                            type="button"
                            onClick={
                                openMyFiles
                            }
                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${activePage === "myfiles"
                                ? "bg-blue-50 font-medium text-blue-700"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >

                            <span>
                                📁
                            </span>

                            My files

                        </button>


                        {/* SHARED */}

                        <button
                            type="button"
                            onClick={openShared}
                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${activePage === "shared"
                                ? "bg-purple-50 font-medium text-purple-700"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <span>
                                👥
                            </span>

                            Shared

                        </button>


                        {/* FAVORITES */}

                        <button
                            type="button"
                            onClick={
                                openFavorites
                            }
                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${activePage === "favorites"
                                ? "bg-yellow-50 font-medium text-yellow-700"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >

                            <span>
                                ⭐
                            </span>

                            Favorites

                        </button>


                        {/* RECYCLE BIN */}

                        <button
                            type="button"
                            onClick={openTrash}
                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${activePage === "trash"
                                ? "bg-green-50 font-medium text-green-700"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >

                            <span>
                                ♻️
                            </span>

                            Recycle bin

                        </button>

                    </nav>

                </div>

            </aside>


            {/* ===================================== */}
            {/* MAIN */}
            {/* ===================================== */}

            <main className="min-w-0 flex-1">


                {/* HEADER */}

                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">

                    <div className="flex items-center gap-4">

                        <button
                            type="button"
                            onClick={() =>
                                setSidebarOpen(
                                    !sidebarOpen
                                )
                            }
                            className="rounded-lg p-2 text-xl hover:bg-gray-100"
                            title="Toggle sidebar"
                        >
                            ☰
                        </button>


                        <button
                            type="button"
                            onClick={goToRoot}
                            className="cursor-pointer text-xl font-semibold text-blue-600 hover:text-blue-700 hover:underline transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            title="Go to Home"
                        >
                            Cloud Storage
                        </button>

                    </div>


                    {/* SEARCH */}

                    <div className="hidden w-96 md:block">

                        <input
                            type="text"
                            value={searchText}
                            onChange={(event) => {
                                setSearchText(
                                    event.target.value
                                );

                                setSearchPage(0);
                            }}
                            placeholder="Search files and folders..."
                            className="h-[42px] w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                        />

                    </div>


                    {/* USER */}

                    <div className="flex items-center gap-3">



                        {/* USER MENU */}

                        <div
                            ref={userMenuRef}
                            className="relative"
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setUserMenuOpen(
                                        (previous) => !previous
                                    )
                                }
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
                            >

                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                                    {user?.name
                                        ?.charAt(0)
                                        .toUpperCase() || "U"}
                                </div>

                                <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-700 md:block">
                                    {user?.name || "User"}
                                </span>

                                <span className="text-xs text-gray-500">
                                    ▼
                                </span>

                            </button>


                            {userMenuOpen && (

                                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

                                    <div className="border-b border-gray-100 px-4 py-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                                                {user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "U"}
                                            </div>

                                            <div className="min-w-0">

                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                    {user?.name || "User"}
                                                </p>

                                                <p className="truncate text-xs text-gray-500">
                                                    {user?.email || ""}
                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <span>🚪</span>
                                        <span>Logout</span>
                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </header>


                {/* CONTENT */}

                <section className="p-6">


                    {/* BREADCRUMB */}

                    {!showFavorites && !showShared && !isTrash && (

                        <div className="mb-6 flex items-center gap-2 text-sm">

                            <button
                                type="button"
                                onClick={
                                    goToRoot
                                }
                                className="font-medium text-gray-900 hover:text-blue-600"
                            >
                                Home
                            </button>


                            {breadcrumbs.map(
                                (
                                    folder,
                                    index
                                ) => (

                                    <div
                                        key={
                                            folder.id
                                        }
                                        className="flex items-center gap-2"
                                    >

                                        <span className="text-gray-400">
                                            /
                                        </span>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                goToBreadcrumb(
                                                    index
                                                )
                                            }
                                            className={
                                                index ===
                                                    breadcrumbs.length - 1
                                                    ? "font-medium text-gray-900"
                                                    : "text-gray-500 hover:text-blue-600"
                                            }
                                        >
                                            {
                                                folder.name
                                            }
                                        </button>

                                    </div>
                                )
                            )}

                        </div>
                    )}


                    {/* PAGE TITLE */}

                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                            <h2 className="text-2xl font-semibold text-gray-900">

                                {isTrash
                                    ? "Recycle bin"
                                    : showShared
                                        ? "Shared by me"
                                        : showFavorites
                                            ? "Favorites"
                                            : currentFolder
                                                ? currentFolder.name
                                                : "My files"}

                            </h2>

                            {!isTrash && (
                                <p className="mt-1 text-sm text-gray-500">
                                    {showShared
                                        ? "Files you have shared with other users."
                                        : showFavorites
                                            ? "Files you have added to favorites."
                                            : "Manage your files and folders."}
                                </p>
                            )}

                        </div>

                        {!isTrash && (
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="file-sort"
                                    className="text-sm font-medium text-gray-600"
                                >
                                    Sort by
                                </label>

                                <select
                                    id="file-sort"
                                    value={sortOption}
                                    onChange={(event) =>
                                        setSortOption(
                                            event.target.value as SortOption
                                        )
                                    }
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                    <option value="size-asc">Size smallest</option>
                                    <option value="size-desc">Size largest</option>
                                </select>
                            </div>
                        )}

                    </div>


                    {/* ALWAYS-MOUNTED FILE PICKER INPUTS */}

                    {/* No accept attribute: CloudDrive accepts any file format. */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Upload complete folder */}
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        // @ts-ignore
                        webkitdirectory=""
                        // @ts-ignore
                        directory=""
                        className="hidden"
                        onChange={handleFolderSelect}
                    />


                    {/* DRAG & DROP OVERLAY */}

                    {showDropOverlay &&
                        !showFavorites &&
                        !showShared &&
                        !isTrash && (

                            <div
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "copy";
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleNativeDrop(event.nativeEvent);
                                }}
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                            >

                                <div
                                    className={`mx-6 w-full max-w-2xl rounded-2xl border-2 border-dashed p-12 text-center shadow-2xl border-blue-500 bg-blue-50`}
                                >

                                    <div className="mb-4 text-6xl">
                                        📥
                                    </div>


                                    <h3 className="text-2xl font-semibold text-gray-900">

                                        Drop files or folders here

                                    </h3>


                                    <p className="mt-2 text-sm text-gray-500">
                                        Release the file anywhere in this area to upload it.
                                    </p>

                                </div>

                            </div>
                        )}


                    {/* UPLOAD PROGRESS */}

                    {!isTrash && uploadFileMutation.isPending && (

                        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">

                            <div className="mb-2 flex items-center justify-between">

                                <div className="flex items-center gap-2">

                                    <span>
                                        📤
                                    </span>

                                    <span className="text-sm font-medium text-gray-800">
                                        Uploading{" "}
                                        {
                                            uploadingFileName
                                        }
                                    </span>

                                </div>


                                <span className="text-sm font-semibold text-blue-600">
                                    {
                                        uploadProgress
                                    }%
                                </span>

                            </div>


                            <div className="h-2 overflow-hidden rounded-full bg-blue-100">

                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-200"
                                    style={{
                                        width:
                                            `${uploadProgress}%`,
                                    }}
                                />

                            </div>

                        </div>
                    )}


                    {/* UPLOAD ERROR */}

                    {!isTrash && uploadError && (

                        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">

                            <div>

                                <p className="font-medium text-red-800">
                                    Upload failed
                                </p>

                                <p className="mt-1 text-sm text-red-600">
                                    {
                                        uploadError
                                    }
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setUploadError(
                                        ""
                                    )
                                }
                                className="text-sm font-medium text-red-700 hover:text-red-900"
                            >
                                Close
                            </button>

                        </div>
                    )}


                    {/* RECYCLE BIN */}

                    {isTrash ? (
                        <div className="space-y-6">

                            {/* DELETED FILES */}
                            <div className="rounded-xl border border-gray-200 bg-white">

                                {trashFilesQuery.isLoading && (
                                    <div className="flex min-h-52 items-center justify-center">
                                        <p className="text-sm text-gray-500">
                                            Loading recycle bin...
                                        </p>
                                    </div>
                                )}

                                {trashFilesQuery.isError && (
                                    <div className="flex min-h-52 flex-col items-center justify-center text-center">
                                        <div className="mb-3 text-4xl">⚠️</div>
                                        <h3 className="font-semibold text-gray-900">
                                            Unable to load recycle bin
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Please try refreshing the page.
                                        </p>
                                    </div>
                                )}

                                {!trashFilesQuery.isLoading &&
                                    !trashFilesQuery.isError &&
                                    (!Array.isArray(trashFilesQuery.data) ||
                                        trashFilesQuery.data.length === 0) && (
                                        <div className="flex min-h-60 flex-col items-center justify-center text-center">
                                            <div className="mb-4 text-6xl">♻️</div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Recycle bin is empty
                                            </h3>
                                            <p className="mt-2 max-w-md text-sm text-gray-500">
                                                Files you delete will appear here.
                                            </p>
                                        </div>
                                    )}

                                {Array.isArray(trashFilesQuery.data) &&
                                    trashFilesQuery.data.length > 0 && (
                                        <div className="divide-y divide-gray-100">
                                            {trashFilesQuery.data.map((file: FileResponse) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between px-5 py-4"
                                                >
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <span className="text-3xl">
                                                            {getFileIcon(file.contentType)}
                                                        </span>

                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium text-gray-900">
                                                                {file.originalFileName}
                                                            </p>

                                                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                                                <span>
                                                                    {formatFileSize(file.size)}
                                                                </span>
                                                                {file.createdAt && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>
                                                                            {new Date(file.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={restoreFileMutation.isPending || permanentlyDeleteFileMutation.isPending}
                                                            onClick={() => {
                                                                restoreFileMutation.mutate(file.id);
                                                            }}
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {restoreFileMutation.isPending
                                                                ? "Restoring..."
                                                                : "Restore"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={permanentlyDeleteFileMutation.isPending || restoreFileMutation.isPending}
                                                            onClick={() => {
                                                                const confirmed = window.confirm(
                                                                    `Permanently delete "${file.originalFileName}"? This action cannot be undone.`
                                                                );

                                                                if (confirmed) {
                                                                    permanentlyDeleteFileMutation.mutate(file.id);
                                                                }
                                                            }}
                                                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {permanentlyDeleteFileMutation.isPending
                                                                ? "Deleting..."
                                                                : "Delete permanently"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    ) : (
                        <>

                            {/* FILE AREA */}

                            <div className="rounded-xl border border-gray-200 bg-white">



                                {/* FOLDERS */}

                                {!isSearching &&
                                    !showShared &&
                                    !foldersLoading &&
                                    !foldersError &&
                                    (
                                        showFavorites
                                            ? favoriteFolders.length > 0
                                            : folders.length > 0
                                    ) && (

                                        <div className="border-b border-gray-200 p-5">

                                            <h4 className="mb-3 text-sm font-medium text-gray-700">
                                                Folders
                                            </h4>


                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                                                {(showFavorites ? sortFolders(favoriteFolders) : sortedFolders).map(
                                                    (
                                                        folder
                                                    ) => (

                                                        <div
                                                            key={folder.id}
                                                            onDoubleClick={() =>
                                                                openFolder(folder)
                                                            }
                                                            className="relative flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                                        >
                                                            <span className="text-4xl">
                                                                📁
                                                            </span>

                                                            <div className="min-w-0 pr-8">
                                                                <p className="truncate font-medium text-gray-900">
                                                                    {folder.name}
                                                                </p>

                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Folder
                                                                </p>
                                                            </div>

                                                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    aria-label={
                                                                        isFolderFavorite(folder.id)
                                                                            ? `Remove ${folder.name} from favorites`
                                                                            : `Add ${folder.name} to favorites`
                                                                    }
                                                                    title={
                                                                        isFolderFavorite(folder.id)
                                                                            ? "Remove from favorites"
                                                                            : "Add to favorites"
                                                                    }
                                                                    disabled={
                                                                        toggleFolderFavoriteMutation.isPending
                                                                    }
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        toggleFolderFavoriteMutation.mutate(folder);
                                                                    }}
                                                                    className="rounded-lg px-1.5 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {isFolderFavorite(folder.id) ? "⭐" : "☆"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    aria-label={`Folder options for ${folder.name}`}
                                                                    title="More options"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setOpenFolderMenu(
                                                                            openFolderMenu === folder.id
                                                                                ? null
                                                                                : folder.id
                                                                        );
                                                                    }}
                                                                    className="rounded-lg p-1.5 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                                >
                                                                    ⋮
                                                                </button>

                                                                {openFolderMenu === folder.id && (
                                                                    <div
                                                                        className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
                                                                        onClick={(event) =>
                                                                            event.stopPropagation()
                                                                        }
                                                                    >
                                                                        {/* SHARE */}
                                                                        <button
                                                                            type="button"
                                                                            disabled={shareFolderMutation.isPending}
                                                                            onClick={() => {
                                                                                setOpenFolderMenu(null);
                                                                                setFolderShareTarget(folder);
                                                                                setFolderShareEmail("");
                                                                                setFolderSharePermission("VIEW");
                                                                            }}
                                                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            <span className="w-5 text-center">
                                                                                ↗
                                                                            </span>
                                                                            <span>
                                                                                {shareFolderMutation.isPending
                                                                                    ? "Sharing..."
                                                                                    : "Share"}
                                                                            </span>
                                                                        </button>

                                                                        {/* DELETE */}
                                                                        <button
                                                                            type="button"
                                                                            disabled={deleteFolderMutation.isPending}
                                                                            onClick={() => {
                                                                                const confirmed =
                                                                                    window.confirm(
                                                                                        `Move "${folder.name}" to Recycle bin?`
                                                                                    );

                                                                                if (!confirmed) {
                                                                                    setOpenFolderMenu(null);
                                                                                    return;
                                                                                }

                                                                                deleteFolderMutation.mutate(
                                                                                    folder.id
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            <span className="w-5 text-center">
                                                                                🗑
                                                                            </span>
                                                                            <span>
                                                                                {deleteFolderMutation.isPending
                                                                                    ? "Deleting..."
                                                                                    : "Delete"}
                                                                            </span>
                                                                        </button>


                                                                        {/* DOWNLOAD */}
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                downloadFolderMutation.isPending
                                                                            }
                                                                            onClick={() => {
                                                                                downloadFolderMutation.mutate(
                                                                                    folder
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            <span className="w-5 text-center">
                                                                                ↓
                                                                            </span>
                                                                            <span>
                                                                                {downloadFolderMutation.isPending
                                                                                    ? "Downloading..."
                                                                                    : "Download"}
                                                                            </span>
                                                                        </button>

                                                                        {/* RENAME */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setRenameFolderTarget(folder);
                                                                                setRenameFolderName(folder.name);
                                                                                setOpenFolderMenu(null);
                                                                            }}
                                                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                                        >
                                                                            <span className="w-5 text-center">
                                                                                ✎
                                                                            </span>
                                                                            <span>Rename</span>
                                                                        </button>
                                                                    </div>


                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}


                                {/* FOLDER LOADING */}

                                {!showFavorites &&
                                    !showShared &&
                                    foldersLoading && (

                                        <div className="flex min-h-32 items-center justify-center border-b border-gray-200">

                                            <p className="text-sm text-gray-500">
                                                Loading folders...
                                            </p>

                                        </div>
                                    )}


                                {/* FOLDER ERROR */}

                                {!showFavorites &&
                                    !showShared &&
                                    foldersError && (

                                        <div className="flex min-h-32 flex-col items-center justify-center border-b border-gray-200 text-center">

                                            <div className="mb-2 text-3xl">
                                                ⚠️
                                            </div>

                                            <h3 className="font-semibold text-gray-900">
                                                Unable to load folders
                                            </h3>

                                        </div>
                                    )}


                                {/* FAVORITES LOADING */}

                                {showFavorites &&
                                    starredFilesQuery.isLoading && (

                                        <div className="flex min-h-40 items-center justify-center">

                                            <p className="text-sm text-gray-500">
                                                Loading favorites...
                                            </p>

                                        </div>
                                    )}


                                {/* FAVORITES ERROR */}

                                {showFavorites &&
                                    starredFilesQuery.isError && (

                                        <div className="flex min-h-40 flex-col items-center justify-center text-center">

                                            <div className="mb-3 text-4xl">
                                                ⚠️
                                            </div>

                                            <h3 className="font-semibold text-gray-900">
                                                Unable to load favorites
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Please try refreshing the page.
                                            </p>

                                        </div>
                                    )}


                                {/* SHARED LOADING */}

                                {showShared &&
                                    sharedFilesQuery.isLoading && (

                                        <div className="flex min-h-40 items-center justify-center">

                                            <p className="text-sm text-gray-500">
                                                Loading shared files...
                                            </p>

                                        </div>
                                    )}


                                {/* SHARED ERROR */}

                                {showShared &&
                                    sharedFilesQuery.isError && (

                                        <div className="flex min-h-40 flex-col items-center justify-center text-center">

                                            <div className="mb-3 text-4xl">
                                                ⚠️
                                            </div>

                                            <h3 className="font-semibold text-gray-900">
                                                Unable to load shared files
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Please try refreshing the page.
                                            </p>

                                        </div>
                                    )}


                                {/* SEARCH LOADING */}

                                {isSearching &&
                                    !showShared &&
                                    !showFavorites &&
                                    (searchQuery.isLoading ||
                                        searchFoldersQuery.isLoading) && (
                                        <div className="flex min-h-40 items-center justify-center">
                                            <p className="text-sm text-gray-500">
                                                Searching files and folders...
                                            </p>
                                        </div>
                                    )}

                                {/* SEARCH FOLDER RESULTS */}

                                {isSearching &&
                                    !showShared &&
                                    !showFavorites &&
                                    !searchFoldersQuery.isLoading &&
                                    searchedFolders.length > 0 && (
                                        <div className="border-b border-gray-200 p-5">
                                            <h4 className="mb-3 text-sm font-medium text-gray-700">
                                                Folders
                                            </h4>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                {sortedSearchedFolders.map((folder) => (
                                                    <div
                                                        key={folder.id}
                                                        onClick={() => {
                                                            setSearchText("");
                                                            setSearchPage(0);
                                                            openFolder(folder);
                                                        }}
                                                        className="relative flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                                    >
                                                        <span className="text-4xl">📁</span>

                                                        <div className="min-w-0 pr-8">
                                                            <p className="truncate font-medium text-gray-900">
                                                                {folder.name}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Folder
                                                            </p>
                                                        </div>

                                                        <div className="absolute right-2 top-2 flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                aria-label={
                                                                    isFolderFavorite(folder.id)
                                                                        ? `Remove ${folder.name} from favorites`
                                                                        : `Add ${folder.name} to favorites`
                                                                }
                                                                title={
                                                                    isFolderFavorite(folder.id)
                                                                        ? "Remove from favorites"
                                                                        : "Add to favorites"
                                                                }
                                                                disabled={
                                                                    toggleFolderFavoriteMutation.isPending
                                                                }
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    toggleFolderFavoriteMutation.mutate(folder);
                                                                }}
                                                                className="rounded-lg px-1.5 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isFolderFavorite(folder.id) ? "⭐" : "☆"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                aria-label={`Folder options for ${folder.name}`}
                                                                title="More options"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    setOpenFolderMenu(
                                                                        openFolderMenu === folder.id
                                                                            ? null
                                                                            : folder.id
                                                                    );
                                                                }}
                                                                className="rounded-lg p-1.5 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                            >
                                                                ⋮
                                                            </button>

                                                            {openFolderMenu === folder.id && (
                                                                <div
                                                                    className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
                                                                    onClick={(event) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                >
                                                                    {/* SHARE */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={shareFolderMutation.isPending}
                                                                        onClick={() => {
                                                                            setOpenFolderMenu(null);
                                                                            setFolderShareTarget(folder);
                                                                            setFolderShareEmail("");
                                                                            setFolderSharePermission("VIEW");
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <span className="w-5 text-center">
                                                                            ↗
                                                                        </span>
                                                                        <span>
                                                                            {shareFolderMutation.isPending
                                                                                ? "Sharing..."
                                                                                : "Share"}
                                                                        </span>
                                                                    </button>

                                                                    {/* DELETE */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={deleteFolderMutation.isPending}
                                                                        onClick={() => {
                                                                            const confirmed =
                                                                                window.confirm(
                                                                                    `Move "${folder.name}" to Recycle bin?`
                                                                                );

                                                                            if (!confirmed) {
                                                                                setOpenFolderMenu(null);
                                                                                return;
                                                                            }

                                                                            deleteFolderMutation.mutate(
                                                                                folder.id
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <span className="w-5 text-center">
                                                                            🗑
                                                                        </span>
                                                                        <span>
                                                                            {deleteFolderMutation.isPending
                                                                                ? "Deleting..."
                                                                                : "Delete"}
                                                                        </span>
                                                                    </button>


                                                                    {/* DOWNLOAD */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            downloadFolderMutation.isPending
                                                                        }
                                                                        onClick={() => {
                                                                            downloadFolderMutation.mutate(
                                                                                folder
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <span className="w-5 text-center">
                                                                            ↓
                                                                        </span>
                                                                        <span>
                                                                            {downloadFolderMutation.isPending
                                                                                ? "Downloading..."
                                                                                : "Download"}
                                                                        </span>
                                                                    </button>

                                                                    {/* RENAME */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRenameFolderTarget(folder);
                                                                            setRenameFolderName(folder.name);
                                                                            setOpenFolderMenu(null);
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                                    >
                                                                        <span className="w-5 text-center">
                                                                            ✎
                                                                        </span>
                                                                        <span>Rename</span>
                                                                    </button>
                                                                </div>


                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {isSearching &&
                                    !showShared &&
                                    !showFavorites &&
                                    !searchQuery.isLoading &&
                                    !searchFoldersQuery.isLoading &&
                                    !searchQuery.isError &&
                                    !searchFoldersQuery.isError &&
                                    displayedFiles.length === 0 &&
                                    searchedFolders.length === 0 && (
                                        <div className="flex min-h-60 flex-col items-center justify-center text-center">
                                            <div className="mb-4 text-5xl">🔍</div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                No files or folders found
                                            </h3>
                                            <p className="mt-2 max-w-md text-sm text-gray-500">
                                                Try searching with another name.
                                            </p>
                                        </div>
                                    )}

                                {/* SEARCH ERROR */}

                                {isSearching &&
                                    !showShared &&
                                    !showFavorites &&
                                    (searchQuery.isError ||
                                        searchFoldersQuery.isError) && (
                                        <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                            <div className="mb-2 text-3xl">⚠️</div>
                                            <h3 className="font-semibold text-gray-900">
                                                Search failed
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Please try again.
                                            </p>
                                        </div>
                                    )}

                                {/* FILE LOADING */}

                                {!isSearching &&
                                    !showShared &&
                                    !showFavorites &&
                                    filesLoading && (

                                        <div className="flex min-h-40 items-center justify-center">

                                            <p className="text-sm text-gray-500">
                                                Loading files...
                                            </p>

                                        </div>
                                    )}


                                {/* FILE ERROR */}

                                {!showShared &&
                                    !showFavorites &&
                                    filesError && (

                                        <div className="flex min-h-40 flex-col items-center justify-center text-center">

                                            <div className="mb-3 text-4xl">
                                                ⚠️
                                            </div>

                                            <h3 className="font-semibold text-gray-900">
                                                Unable to load files
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Please try refreshing the page.
                                            </p>

                                        </div>
                                    )}


                                {/* EMPTY STATE */}

                                {!isSearching &&
                                    !filesLoading &&
                                    !filesError &&
                                    !starredFilesQuery.isLoading &&
                                    !starredFilesQuery.isError &&
                                    !sharedFilesQuery.isLoading &&
                                    !sharedFilesQuery.isError &&
                                    displayedFiles.length === 0 &&
                                    (!showFavorites ||
                                        favoriteFolders.length === 0) && (

                                        <div className="flex min-h-60 flex-col items-center justify-center text-center">

                                            <div className="mb-4 text-6xl">
                                                {showShared
                                                    ? "👥"
                                                    : showFavorites
                                                        ? "⭐"
                                                        : "📂"}
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900">

                                                {showShared
                                                    ? "No files shared with you"
                                                    : showFavorites
                                                        ? "No favorite files"
                                                        : "No files or folders yet"}

                                            </h3>

                                            <p className="mt-2 max-w-md text-sm text-gray-500">

                                                {showShared
                                                    ? "Files that other users share with you will appear here."
                                                    : showFavorites
                                                        ? "Files you add to favorites will appear here."
                                                        : "Create a folder or upload files to get started."}

                                            </p>

                                        </div>
                                    )}


                                {/* FAVORITE FOLDERS ONLY / FILES SECTION */}

                                {showFavorites &&
                                    favoriteFolders.length > 0 &&
                                    displayedFiles.length === 0 && (
                                        <div className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">
                                            No favorite files. Your favorite folders are shown above.
                                        </div>
                                    )}

                                {/* FILE LIST */}

                                {(!isSearching || !searchQuery.isLoading) &&
                                    !filesLoading &&
                                    !filesError &&
                                    !starredFilesQuery.isLoading &&
                                    !starredFilesQuery.isError &&
                                    !sharedFilesQuery.isLoading &&
                                    !sharedFilesQuery.isError &&
                                    displayedFiles.length > 0 && (

                                        <div className="divide-y divide-gray-100">

                                            {sortedDisplayedFiles.map(
                                                (
                                                    file
                                                ) => (

                                                    <div
                                                        key={
                                                            file.id
                                                        }
                                                        onDoubleClick={() =>
                                                            openStoredFilePreview(
                                                                file
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between px-5 py-4 transition hover:bg-gray-50"
                                                    >


                                                        {/* FILE INFO */}

                                                        <div className="flex min-w-0 items-center gap-4">

                                                            <span className="text-3xl">

                                                                {
                                                                    getFileIcon(
                                                                        file.contentType
                                                                    )
                                                                }

                                                            </span>


                                                            <div className="min-w-0">

                                                                <div className="flex items-center gap-2">

                                                                    <p className="truncate font-medium text-gray-900">
                                                                        {
                                                                            file.originalFileName
                                                                        }
                                                                    </p>

                                                                    {isFileStarred(
                                                                        file.id
                                                                    ) && (

                                                                            <span
                                                                                className="text-sm"
                                                                                title="Favorite"
                                                                            >
                                                                                ⭐
                                                                            </span>

                                                                        )}

                                                                </div>


                                                                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">

                                                                    <span>
                                                                        {
                                                                            formatFileSize(
                                                                                file.size
                                                                            )
                                                                        }
                                                                    </span>


                                                                    {file.createdAt && (
                                                                        <>

                                                                            <span>
                                                                                •
                                                                            </span>

                                                                            <span>
                                                                                {
                                                                                    new Date(
                                                                                        file.createdAt
                                                                                    ).toLocaleDateString()
                                                                                }
                                                                            </span>

                                                                        </>
                                                                    )}

                                                                </div>

                                                            </div>

                                                        </div>


                                                        {/* ACTIONS */}

                                                        <div
                                                            data-file-menu
                                                            className="relative flex items-center"
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    event
                                                                ) => {

                                                                    event.stopPropagation();

                                                                    setOpenFileMenu(
                                                                        openFileMenu === file.id
                                                                            ? null
                                                                            : file.id
                                                                    );
                                                                }}
                                                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                                title="More options"
                                                            >
                                                                ⋮
                                                            </button>


                                                            {/* FILE OPTIONS MENU */}

                                                            {openFileMenu === file.id && (

                                                                <div
                                                                    className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
                                                                    onClick={(
                                                                        event
                                                                    ) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                >


                                                                    {/* SHARE */}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {

                                                                            setOpenFileMenu(
                                                                                null
                                                                            );

                                                                            setShareFile(
                                                                                file
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                                    >

                                                                        <span className="w-5 text-center">
                                                                            ↗
                                                                        </span>

                                                                        <span>
                                                                            Share
                                                                        </span>

                                                                    </button>


                                                                    {/* DELETE */}

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            deleteFileMutation.isPending
                                                                        }
                                                                        onClick={() => {

                                                                            const confirmed =
                                                                                window.confirm(
                                                                                    `Move "${file.originalFileName}" to Recycle bin?`
                                                                                );

                                                                            if (
                                                                                !confirmed
                                                                            ) {

                                                                                return;
                                                                            }

                                                                            deleteFileMutation.mutate(
                                                                                file.id
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >

                                                                        <span className="w-5 text-center">
                                                                            🗑
                                                                        </span>

                                                                        <span>
                                                                            {deleteFileMutation.isPending
                                                                                ? "Deleting..."
                                                                                : "Delete"}
                                                                        </span>

                                                                    </button>


                                                                    {/* FAVORITES */}

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            starMutation.isPending ||
                                                                            unstarMutation.isPending
                                                                        }
                                                                        onClick={() => {

                                                                            if (
                                                                                isFileStarred(
                                                                                    file.id
                                                                                )
                                                                            ) {

                                                                                unstarMutation.mutate(
                                                                                    file.id
                                                                                );

                                                                            } else {

                                                                                starMutation.mutate(
                                                                                    file.id
                                                                                );
                                                                            }

                                                                            setOpenFileMenu(
                                                                                null
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >

                                                                        <span className="w-5 text-center">
                                                                            ⭐
                                                                        </span>

                                                                        <span>

                                                                            {starMutation.isPending ||
                                                                                unstarMutation.isPending
                                                                                ? "Updating..."
                                                                                : isFileStarred(
                                                                                    file.id
                                                                                )
                                                                                    ? "Remove from favorites"
                                                                                    : "Add to favorites"}

                                                                        </span>

                                                                    </button>


                                                                    {/* DOWNLOAD */}

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            downloadFileMutation.isPending
                                                                        }
                                                                        onClick={() => {

                                                                            downloadFileMutation.mutate({
                                                                                fileId:
                                                                                    file.id,

                                                                                fileName:
                                                                                    file.originalFileName,
                                                                            });
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >

                                                                        <span className="w-5 text-center">
                                                                            ↓
                                                                        </span>

                                                                        <span>
                                                                            {downloadFileMutation.isPending
                                                                                ? "Downloading..."
                                                                                : "Download"}
                                                                        </span>

                                                                    </button>


                                                                    {/* RENAME */}

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            renameFileMutation.isPending ||
                                                                            showShared
                                                                        }
                                                                        onClick={() => {

                                                                            setRenameFileTarget(file);

                                                                            setRenameFileName(
                                                                                file.originalFileName
                                                                            );

                                                                            setOpenFileMenu(null);
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >

                                                                        <span className="w-5 text-center">
                                                                            ✎
                                                                        </span>

                                                                        <span>
                                                                            Rename
                                                                        </span>

                                                                    </button>








                                                                </div>
                                                            )}

                                                        </div>

                                                    </div>
                                                )
                                            )}

                                        </div>
                                    )}

                            </div>

                        </>
                    )}

                </section>

            </main>


            {/* ===================================== */}
            {/* RENAME FOLDER MODAL */}
            {/* ===================================== */}

            {renameFolderTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Rename folder
                            </h2>

                            <button
                                type="button"
                                disabled={renameFolderMutation.isPending}
                                onClick={() => {
                                    setRenameFolderTarget(null);
                                    setRenameFolderName("");
                                }}
                                className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                            Enter a new name for this folder.
                        </p>

                        <input
                            autoFocus
                            type="text"
                            value={renameFolderName}
                            onChange={(event) =>
                                setRenameFolderName(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    if (!renameFolderMutation.isPending) {
                                        setRenameFolderTarget(null);
                                        setRenameFolderName("");
                                    }
                                    return;
                                }

                                if (event.key === "Enter") {
                                    const trimmedName =
                                        renameFolderName.trim();

                                    if (
                                        trimmedName &&
                                        !renameFolderMutation.isPending
                                    ) {
                                        renameFolderMutation.mutate({
                                            folderId: renameFolderTarget.id,
                                            name: trimmedName,
                                        });
                                    }
                                }
                            }}
                            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={renameFolderMutation.isPending}
                                onClick={() => {
                                    setRenameFolderTarget(null);
                                    setRenameFolderName("");
                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    renameFolderMutation.isPending ||
                                    !renameFolderName.trim()
                                }
                                onClick={() => {
                                    const trimmedName =
                                        renameFolderName.trim();

                                    if (!trimmedName) {
                                        return;
                                    }

                                    renameFolderMutation.mutate({
                                        folderId: renameFolderTarget.id,
                                        name: trimmedName,
                                    });
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {renameFolderMutation.isPending
                                    ? "Renaming..."
                                    : "Rename"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================== */}
            {/* RENAME FILE MODAL */}
            {/* ===================================== */}

            {renameFileTarget && (

                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">

                        <div className="flex items-center justify-between">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Rename file
                            </h2>

                            <button
                                type="button"
                                disabled={renameFileMutation.isPending}
                                onClick={() => {
                                    setRenameFileTarget(null);
                                    setRenameFileName("");
                                }}
                                className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                ✕
                            </button>

                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                            Enter a new name for this file.
                        </p>

                        <input
                            autoFocus
                            type="text"
                            value={renameFileName}
                            onChange={(event) =>
                                setRenameFileName(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {

                                if (event.key === "Escape") {
                                    if (!renameFileMutation.isPending) {
                                        setRenameFileTarget(null);
                                        setRenameFileName("");
                                    }
                                    return;
                                }

                                if (event.key === "Enter") {

                                    const trimmedName =
                                        renameFileName.trim();

                                    if (
                                        trimmedName &&
                                        !renameFileMutation.isPending
                                    ) {
                                        renameFileMutation.mutate({
                                            fileId:
                                                renameFileTarget.id,
                                            fileName:
                                                trimmedName,
                                        });
                                    }
                                }
                            }}
                            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-5 flex justify-end gap-3">

                            <button
                                type="button"
                                disabled={renameFileMutation.isPending}
                                onClick={() => {
                                    setRenameFileTarget(null);
                                    setRenameFileName("");
                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    !renameFileName.trim() ||
                                    renameFileMutation.isPending
                                }
                                onClick={() => {

                                    const trimmedName =
                                        renameFileName.trim();

                                    if (!trimmedName) {
                                        return;
                                    }

                                    renameFileMutation.mutate({
                                        fileId:
                                            renameFileTarget.id,
                                        fileName:
                                            trimmedName,
                                    });
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {renameFileMutation.isPending
                                    ? "Renaming..."
                                    : "Rename"}
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* ===================================== */}
            {/* SEARCH PAGINATION */}
            {/* ===================================== */}

            {isSearching &&
                !showShared &&
                !showFavorites &&
                searchQuery.data &&
                searchQuery.data.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-500">
                            Page {searchQuery.data.number + 1} of{" "}
                            {searchQuery.data.totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={searchQuery.data.first}
                                onClick={() =>
                                    setSearchPage((page) =>
                                        Math.max(0, page - 1)
                                    )
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={searchQuery.data.last}
                                onClick={() =>
                                    setSearchPage((page) => page + 1)
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

            {/* ===================================== */}
            {/* CREATE FOLDER MODAL */}
            {/* ===================================== */}

            {folderModalOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

                        <h2 className="text-xl font-semibold text-gray-900">
                            Create new folder
                        </h2>


                        <p className="mt-1 text-sm text-gray-500">

                            {currentFolder
                                ? `Create a folder inside "${currentFolder.name}".`
                                : "Enter a name for your new folder."}

                        </p>


                        <input
                            type="text"
                            value={
                                folderName
                            }
                            onChange={(
                                event
                            ) =>
                                setFolderName(
                                    event.target.value
                                )
                            }
                            placeholder="Folder name"
                            autoFocus
                            className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                            onKeyDown={(
                                event
                            ) => {

                                if (
                                    event.key ===
                                    "Enter" &&
                                    folderName.trim()
                                ) {

                                    createFolderMutation
                                        .mutate({

                                            name:
                                                folderName.trim(),

                                            parentId:
                                                currentFolder?.id ??
                                                null,
                                        });
                                }
                            }}
                        />


                        <div className="mt-5 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() => {

                                    setFolderModalOpen(
                                        false
                                    );

                                    setFolderName(
                                        ""
                                    );

                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                disabled={
                                    !folderName.trim() ||
                                    createFolderMutation.isPending
                                }
                                onClick={() => {

                                    createFolderMutation
                                        .mutate({

                                            name:
                                                folderName.trim(),

                                            parentId:
                                                currentFolder?.id ??
                                                null,
                                        });
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {
                                    createFolderMutation.isPending
                                        ? "Creating..."
                                        : "Create folder"
                                }

                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* ===================================== */}
            {/* FILE PREVIEW MODAL */}
            {/* ===================================== */}

            {(previewFile ||
                storedPreviewFile) && (

                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">

                        <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">


                            {/* HEADER */}

                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                                <div className="min-w-0">

                                    <h2 className="truncate font-semibold text-gray-900">

                                        {previewFile
                                            ? previewFile.name
                                            : storedPreviewFile?.originalFileName}

                                    </h2>


                                    <p className="mt-1 text-xs text-gray-500">

                                        {
                                            formatFileSize(
                                                previewFile
                                                    ? previewFile.size
                                                    : storedPreviewFile?.size ??
                                                    0
                                            )
                                        }

                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        closePreview
                                    }
                                    className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    title="Close preview"
                                >
                                    ✕
                                </button>

                            </div>


                            {/* PREVIEW */}

                            <div className="flex min-h-[400px] flex-1 items-center justify-center overflow-auto bg-gray-100 p-5">


                                {/* IMAGE */}

                                {(previewFile?.type.startsWith(
                                    "image/"
                                ) ||
                                    storedPreviewFile?.contentType.startsWith(
                                        "image/"
                                    )) &&
                                    previewUrl && (

                                        <img
                                            src={
                                                previewUrl
                                            }
                                            alt={
                                                previewFile?.name ||
                                                storedPreviewFile?.originalFileName ||
                                                "Preview"
                                            }
                                            className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
                                        />

                                    )}


                                {/* PDF */}

                                {(previewFile?.type ===
                                    "application/pdf" ||
                                    storedPreviewFile?.contentType ===
                                    "application/pdf") &&
                                    previewUrl && (

                                        <iframe
                                            src={
                                                previewUrl
                                            }
                                            title={
                                                previewFile?.name ||
                                                storedPreviewFile?.originalFileName ||
                                                "PDF Preview"
                                            }
                                            className="h-[75vh] w-full rounded-lg border border-gray-300 bg-white"
                                        />

                                    )}

                            </div>


                            {/* FOOTER */}

                            <div className="flex justify-end border-t border-gray-200 px-5 py-4">

                                <button
                                    type="button"
                                    onClick={
                                        closePreview
                                    }
                                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}


            {/* ===================================== */}
            {/* FOLDER SHARE MODAL */}
            {/* Same interaction style as file sharing */}
            {/* ===================================== */}

            {folderShareTarget && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget &&
                            !shareFolderMutation.isPending) {
                            setFolderShareTarget(null);
                            setFolderShareEmail("");
                            setFolderSharePermission("VIEW");
                        }
                    }}
                >
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Share folder
                                </h2>
                                <p className="mt-1 truncate text-sm text-gray-500">
                                    {folderShareTarget.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={shareFolderMutation.isPending}
                                onClick={() => {
                                    setFolderShareTarget(null);
                                    setFolderShareEmail("");
                                    setFolderSharePermission("VIEW");
                                }}
                                className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                                aria-label="Close share dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-5 px-6 py-6">
                            <div>
                                <label
                                    htmlFor="folder-share-email"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Email address
                                </label>

                                <input
                                    id="folder-share-email"
                                    type="email"
                                    value={folderShareEmail}
                                    onChange={(event) =>
                                        setFolderShareEmail(event.target.value)
                                    }
                                    placeholder="Enter user's email"
                                    autoFocus
                                    disabled={shareFolderMutation.isPending}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="folder-share-permission"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Permission
                                </label>

                                <select
                                    id="folder-share-permission"
                                    value={folderSharePermission}
                                    onChange={(event) =>
                                        setFolderSharePermission(
                                            event.target.value as "VIEW" | "EDIT"
                                        )
                                    }
                                    disabled={shareFolderMutation.isPending}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                                >
                                    <option value="VIEW">Viewer</option>
                                    <option value="EDIT">Editor</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">
                            <button
                                type="button"
                                disabled={shareFolderMutation.isPending}
                                onClick={() => {
                                    setFolderShareTarget(null);
                                    setFolderShareEmail("");
                                    setFolderSharePermission("VIEW");
                                }}
                                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    shareFolderMutation.isPending ||
                                    !folderShareEmail.trim()
                                }
                                onClick={() => {
                                    shareFolderMutation.mutate({
                                        folder: folderShareTarget,
                                        email: folderShareEmail.trim(),
                                        permission: folderSharePermission,
                                    });
                                }}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {shareFolderMutation.isPending
                                    ? "Sharing..."
                                    : "Share"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================== */}
            {/* SHARE MODAL */}
            {/* ===================================== */}

            {shareFile && (

                <ShareModal
                    fileId={
                        shareFile.id
                    }

                    fileName={
                        shareFile.originalFileName
                    }

                    onClose={() =>
                        setShareFile(
                            null
                        )
                    }
                />

            )}

        </div>
    );
}


export default Dashboard;
