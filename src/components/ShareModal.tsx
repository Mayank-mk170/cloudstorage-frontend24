import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    createShare,
    createPublicLink,
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

    // Public link
    const [publicLinkToken, setPublicLinkToken] =
        useState<string | null>(null);

    const [publicLinkCopied, setPublicLinkCopied] =
        useState(false);

    const [copyingPublicLink, setCopyingPublicLink] =
        useState(false);

    // ==========================================
    // SHARE WITH PERSON
    // ==========================================

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

        onError: (err: any) => {
            console.error("Share failed:", err);

            const message = err?.response?.data;

            setSuccess("");

            setError(
                typeof message === "string"
                    ? message
                    : "Failed to share file."
            );
        },
    });

    // ==========================================
    // CREATE / REUSE PUBLIC LINK
    // ==========================================

    const createPublicLinkMutation = useMutation({
        mutationFn: createPublicLink,

        onSuccess: (token: string) => {
            setPublicLinkToken(token);
            setError("");
        },

        onError: (err: any) => {
            console.error(
                "Create/reuse public link failed:",
                err
            );

            const message = err?.response?.data;

            setSuccess("");

            setError(
                typeof message === "string"
                    ? message
                    : "Unable to create or access the public link."
            );
        },
    });

    // ==========================================
    // PUBLIC LINK URL
    // ==========================================

    const getPublicShareUrl = (token: string) => {
        return `${window.location.origin}/share/${token}`;
    };

    // ==========================================
    // COPY PUBLIC LINK
    // ==========================================

    const handleCopyPublicLink = async () => {
        if (
            copyingPublicLink ||
            createPublicLinkMutation.isPending
        ) {
            return;
        }

        setCopyingPublicLink(true);
        setError("");
        setSuccess("");

        try {
            let token = publicLinkToken;

            // Create the link only if we do not already have
            // the token in this modal.
            //
            // The backend should return the existing token if
            // the file already has a public link.
            if (!token) {
                token =
                    await createPublicLinkMutation.mutateAsync({
                        fileId,
                        expiresAt: null,
                    });

                setPublicLinkToken(token);
            }

            const url = getPublicShareUrl(token);

            // Clipboard API
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                // Fallback for browsers where Clipboard API
                // is unavailable or blocked.
                const textarea =
                    document.createElement("textarea");

                textarea.value = url;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.top = "0";
                textarea.setAttribute("readonly", "");

                document.body.appendChild(textarea);

                textarea.focus();
                textarea.select();

                const copied =
                    document.execCommand("copy");

                document.body.removeChild(textarea);

                if (!copied) {
                    throw new Error(
                        "Clipboard copy failed"
                    );
                }
            }

            setPublicLinkCopied(true);
            setSuccess("Link copied to clipboard.");

            window.setTimeout(() => {
                setPublicLinkCopied(false);
                setSuccess("");
            }, 2000);
        } catch (err) {
            console.error(
                "Copy public link failed:",
                err
            );

            setPublicLinkCopied(false);
            setError("Unable to create or copy the link.");
        } finally {
            setCopyingPublicLink(false);
        }
    };

    // ==========================================
    // CLEAR SUCCESS / ERROR MESSAGE
    // ==========================================

    useEffect(() => {
        if (!success && !error) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [success, error]);

    // ==========================================
    // SHARE HANDLER
    // ==========================================

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

    // ==========================================
    // UI
    // ==========================================

    return (
        <div
            className="
                fixed inset-0 z-[70]
                flex items-center justify-center
                bg-black/50
                p-4
            "
            onClick={onClose}
        >
            <div
                className="
                    flex
                    w-full
                    max-w-2xl
                    max-h-[90vh]
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-gray-200
                        px-6
                        py-5
                    "
                >
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
                        className="
                            ml-4
                            shrink-0
                            rounded-lg
                            p-2
                            text-xl
                            text-gray-500
                            hover:bg-gray-100
                            hover:text-gray-900
                        "
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* SCROLLABLE CONTENT */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >
                    {/* SHARE WITH PERSON */}

                    <form
                        onSubmit={handleShare}
                        className="
                            border-b
                            border-gray-200
                            p-6
                        "
                    >
                        <h3 className="mb-4 font-medium text-gray-900">
                            Share with
                        </h3>

                        <div
                            className="
                                grid
                                grid-cols-1
                                gap-3
                                md:grid-cols-[1fr_130px_auto]
                            "
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                }}
                                placeholder="Enter email address"
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-gray-300
                                    px-4
                                    py-2.5
                                    outline-none
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                            <select
                                value={permission}
                                onChange={(event) => {
                                    setPermission(
                                        event.target.value as SharePermission
                                    );
                                }}
                                className="
                                    rounded-lg
                                    border
                                    border-gray-300
                                    px-3
                                    py-2.5
                                    outline-none
                                    focus:border-blue-500
                                "
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
                                className="
                                    rounded-lg
                                    bg-blue-600
                                    px-5
                                    py-2.5
                                    font-medium
                                    text-white
                                    hover:bg-blue-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {createShareMutation.isPending
                                    ? "Sharing..."
                                    : "Share"}
                            </button>
                        </div>

                        {/* EXPIRY */}

                        <div className="mt-4">
                            <label
                                className="
                                    mb-1
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                "
                            >
                                Expiry date (optional)
                            </label>

                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(event) => {
                                    setExpiresAt(
                                        event.target.value
                                    );
                                }}
                                min={new Date()
                                    .toISOString()
                                    .slice(0, 16)}
                                className="
                                    w-full
                                    max-w-xs
                                    rounded-lg
                                    border
                                    border-gray-300
                                    px-3
                                    py-2
                                    outline-none
                                    focus:border-blue-500
                                "
                            />
                        </div>

                        {/* ERROR */}

                        {error && (
                            <div
                                className="
                                    mt-4
                                    rounded-lg
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4
                                    py-3
                                    text-sm
                                    text-red-700
                                "
                            >
                                {error}
                            </div>
                        )}

                        {/* SUCCESS */}

                        {success && (
                            <div
                                className="
                                    mt-4
                                    rounded-lg
                                    border
                                    border-green-200
                                    bg-green-50
                                    px-4
                                    py-3
                                    text-sm
                                    text-green-700
                                "
                            >
                                {success}
                            </div>
                        )}
                    </form>

                    {/* GENERAL ACCESS */}

                    <div
                        className="
                            border-b
                            border-gray-200
                            p-6
                        "
                    >
                        <div
                            className="
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                p-4
                            "
                        >
                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-4
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                "
                            >
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-900">
                                        General access
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Anyone with the link can
                                        access this file.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        copyingPublicLink ||
                                        createPublicLinkMutation.isPending
                                    }
                                    onClick={
                                        handleCopyPublicLink
                                    }
                                    className="
                                        shrink-0
                                        rounded-lg
                                        bg-blue-600
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-white
                                        hover:bg-blue-700
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {copyingPublicLink ||
                                    createPublicLinkMutation.isPending
                                        ? "Copying..."
                                        : publicLinkCopied
                                            ? "Copied!"
                                            : "Copy link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}

                <div
                    className="
                        flex
                        shrink-0
                        justify-end
                        border-t
                        border-gray-200
                        bg-white
                        px-6
                        py-4
                    "
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            rounded-lg
                            bg-gray-900
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            hover:bg-gray-800
                        "
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
