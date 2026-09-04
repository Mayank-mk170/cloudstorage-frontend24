import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    createShare,
    getSharesForFile,
    removeShare,
    type SharePermission,
} from "../services/shareService";

interface ShareModalProps {
    fileId: number;
    fileName: string;
    onClose: () => void;
}

function ShareModal({
    fileId,
    fileName,
    onClose,
}: ShareModalProps) {

    const queryClient = useQueryClient();

    const [email, setEmail] = useState("");
    const [permission, setPermission] =
        useState<SharePermission>("VIEW");
    const [expiresAt, setExpiresAt] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const {
        data: shares = [],
        isLoading: sharesLoading,
        isError: sharesError,
    } = useQuery({
        queryKey: ["file-shares", fileId],
        queryFn: () => getSharesForFile(fileId),
        enabled: fileId > 0,
    });

    const createShareMutation = useMutation({
        mutationFn: createShare,

        onSuccess: () => {
            setEmail("");
            setPermission("VIEW");
            setExpiresAt("");
            setError("");
            setSuccess("File shared successfully.");

            queryClient.invalidateQueries({
                queryKey: ["file-shares", fileId],
            });

            queryClient.invalidateQueries({
                queryKey: ["sharedFiles"],
            });
        },

        onError: (error: any) => {
            console.error("Share failed:", error);

            const message = error?.response?.data;

            setSuccess("");

            setError(
                typeof message === "string"
                    ? message
                    : "Failed to share file."
            );
        },
    });

    const removeShareMutation = useMutation({
        mutationFn: removeShare,

        onSuccess: () => {
            setError("");
            setSuccess("Access removed successfully.");

            queryClient.invalidateQueries({
                queryKey: ["file-shares", fileId],
            });

            queryClient.invalidateQueries({
                queryKey: ["sharedFiles"],
            });
        },

        onError: (error: any) => {
            console.error(
                "Remove share failed:",
                error
            );

            const message = error?.response?.data;

            setSuccess("");

            setError(
                typeof message === "string"
                    ? message
                    : "Failed to remove access."
            );
        },
    });

    useEffect(() => {
        if (!success && !error) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [success, error]);

    const handleShare = (event: FormEvent) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter an email address.");
            return;
        }

        createShareMutation.mutate({
            fileId,
            email: trimmedEmail,
            permission,
            expiresAt: expiresAt
                ? new Date(expiresAt).toISOString()
                : null,
        });
    };

    const handleRemoveShare = (
        shareId: number,
        sharedWithEmail: string
    ) => {
        const confirmed = window.confirm(
            `Remove access for ${sharedWithEmail}?`
        );

        if (!confirmed) {
            return;
        }

        removeShareMutation.mutate(shareId);
    };

    const formatDate = (
        value?: string | null
    ) => {
        if (!value) {
            return "No expiry";
        }

        return new Date(value).toLocaleString();
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Share file
                        </h2>

                        <p className="mt-1 truncate text-sm text-gray-500">
                            {fileName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                <form
                    onSubmit={handleShare}
                    className="border-b border-gray-200 p-6"
                >
                    <h3 className="mb-4 font-medium text-gray-900">
                        Share with
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px_auto]">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter email address"
                            className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <select
                            value={permission}
                            onChange={(event) =>
                                setPermission(
                                    event.target.value as SharePermission
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                        >
                            <option value="VIEW">
                                Viewer
                            </option>

                            <option value="EDIT">
                                Editor
                            </option>
                        </select>

                        <button
                            type="submit"
                            disabled={
                                createShareMutation.isPending
                            }
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createShareMutation.isPending
                                ? "Sharing..."
                                : "Share"}
                        </button>
                    </div>

                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Expiry date (optional)
                        </label>

                        <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(event) =>
                                setExpiresAt(event.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {success}
                        </div>
                    )}
                </form>

                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                            People with access
                        </h3>

                        <span className="text-sm text-gray-500">
                            {shares.length}{" "}
                            {shares.length === 1
                                ? "person"
                                : "people"}
                        </span>
                    </div>

                    {sharesLoading && (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">
                                Loading people with access...
                            </p>
                        </div>
                    )}

                    {sharesError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Unable to load sharing information.
                        </div>
                    )}

                    {!sharesLoading &&
                        !sharesError &&
                        shares.length === 0 && (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                                <div className="mb-2 text-3xl">
                                    👥
                                </div>

                                <p className="font-medium text-gray-700">
                                    Not shared with anyone
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    Add a person's email above to share this file.
                                </p>
                            </div>
                        )}

                    {!sharesLoading &&
                        !sharesError &&
                        shares.length > 0 && (
                            <div className="max-h-72 space-y-2 overflow-y-auto">
                                {shares.map((share) => (
                                    <div
                                        key={share.id}
                                        className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                                {share.sharedWithEmail
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-gray-900">
                                                    {share.sharedWithEmail}
                                                </p>

                                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                                    <span className="rounded-full bg-gray-100 px-2 py-1">
                                                        {share.permission === "EDIT"
                                                            ? "Editor"
                                                            : "Viewer"}
                                                    </span>

                                                    <span>
                                                        {formatDate(
                                                            share.expiresAt
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={
                                                removeShareMutation.isPending
                                            }
                                            onClick={() =>
                                                handleRemoveShare(
                                                    share.id,
                                                    share.sharedWithEmail
                                                )
                                            }
                                            className="ml-4 shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>

                <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
