"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
    getDraftPosts, 
    deletePost 
} from "@/services/postService";
import type { DraftPost } from "@/services/postService";

export default function DraftPosts() {
    const [drafts, setDrafts] = useState<DraftPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchDrafts = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedDrafts = await getDraftPosts();
                setDrafts(fetchedDrafts);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch drafts.");
                console.error("Error fetching drafts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
    }, []);

    const handleSelectPost = (postId: number) => {
        setSelectedPosts((prev) =>
            prev.includes(postId) 
                ? prev.filter((id) => id !== postId) 
                : [...prev, postId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedPosts.length === 0) return;

        setDeleting(true);
        try {
            await Promise.all(selectedPosts.map((postId) => deletePost(postId)));
            setDrafts((prevDrafts) => 
                prevDrafts.filter((draft) => !selectedPosts.includes(draft.id))
            );
            setSelectedPosts([]);
            setShowModal(false);
        } catch (err) {
            console.error("Error deleting drafts:", err);
            alert("Failed to delete the selected drafts. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const openModal = () => {
        if (selectedPosts.length === 0) {
            alert("Please select at least one post to delete.");
            return;
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    if (loading) {
        return <div className="text-center text-gray-500">Loading drafts...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
                Draft Posts
            </h2>
            {drafts.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-300">
                    No drafts available. Start creating your first draft!
                </p>
            ) : (
                <>
                    <div className="flex justify-end">
                        <button
                            onClick={openModal}
                            disabled={selectedPosts.length === 0}
                            className={`rounded-md py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none ${
                                selectedPosts.length === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-500 hover:bg-red-600"
                            }`}
                        >
                            Delete Selected
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="rounded-lg bg-white border border-gray-300 p-5 shadow-md dark:border-gray-600"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                                        {draft.title || "Untitled Draft"}
                                    </h3>
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.includes(draft.id)}
                                        onChange={() => handleSelectPost(draft.id)}
                                        className="form-checkbox h-5 w-5 text-primary"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                    {draft.description || "No description available."}
                                </p>
                                {draft.hashtags && draft.hashtags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {draft.hashtags.map((hashtag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-sm rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                {hashtag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-4 flex items-center justify-between">
                                    <span
                                        className={`text-sm font-medium ${
                                            draft.scheduled_for ? "text-green-600" : "text-gray-500"
                                        }`}
                                    >
                                        {draft.scheduled_for
                                            ? `Scheduled: ${new Date(draft.scheduled_for).toLocaleString()}`
                                            : "Not scheduled"}
                                    </span>
                                    <span
                                        className={`text-sm font-semibold px-2 py-1 rounded-md ${
                                            draft.status === "draft"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                                    </span>
                                </div>
                                <div className="mt-4 flex justify-between">
                                    <Link href={`/editPost/${draft.id}`}>
                                        <button className="rounded-md bg-primary hover:bg-primary-dark text-white py-2 px-4 text-sm focus:outline-none">
                                            Edit
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete the selected drafts? This action cannot be undone.
                        </p>
                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                className={`rounded-md py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none ${
                                    deleting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}