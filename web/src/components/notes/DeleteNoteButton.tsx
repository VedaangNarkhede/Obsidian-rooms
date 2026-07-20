'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteNoteButtonProps {
    noteId: string;
    vaultId: string;
}

export function DeleteNoteButton({ noteId, vaultId }: DeleteNoteButtonProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (confirmText.trim().toLowerCase() !== 'delete') {
            setError("Please type 'delete' to confirm.");
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const res = await fetch(`/api/notes/${noteId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete note');
            }

            // Successfully deleted, redirect to vault dashboard root
            router.push(`/dashboard/${vaultId}`);
            router.refresh(); // Force a re-fetch of the server layout to update graphs/file tree
        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#e93147',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(233, 49, 71, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Note
            </button>

            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h2 style={{ color: '#e5c07b', marginTop: 0, marginBottom: '1rem' }}>Delete Note?</h2>
                        <p style={{ color: '#abb2bf', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            This action cannot be undone. If this note has images that are not used by any other note, they will also be permanently deleted.
                        </p>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#abb2bf', fontSize: '0.85rem' }}>
                                Type <strong>delete</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="delete"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#121212',
                                    border: '1px solid #333',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {error && <div style={{ color: '#e93147', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setConfirmText('');
                                    setError('');
                                }}
                                disabled={isDeleting}
                                style={{
                                    background: 'none',
                                    border: '1px solid #333',
                                    color: '#abb2bf',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || confirmText.trim().toLowerCase() !== 'delete'}
                                style={{
                                    backgroundColor: '#e93147',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: (isDeleting || confirmText.trim().toLowerCase() !== 'delete') ? 'not-allowed' : 'pointer',
                                    opacity: (isDeleting || confirmText.trim().toLowerCase() !== 'delete') ? 0.5 : 1
                                }}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
