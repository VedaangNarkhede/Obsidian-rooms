'use client';

import React, { useState } from 'react';

interface VaultOverviewClientProps {
    vaultId: string;
    folders: string[];
    isOwner: boolean;
}

export default function VaultOverviewClient({ vaultId, folders, isOwner }: VaultOverviewClientProps) {
    const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

    const handleDeleteFolder = async () => {
        if (!deletingFolder) return;
        if (deleteConfirmationInput !== 'delete') {
            alert('Please type "delete" to confirm.');
            return;
        }
        
        const folderName = deletingFolder;
            try {
                const res = await fetch(`/api/vaults/${vaultId}/folder`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folderName })
                });
                if (res.ok) {
                    window.location.reload();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete folder');
                }
            } catch (err: any) {
                alert(err.message);
            } finally {
                setDeletingFolder(null);
                setDeleteConfirmationInput('');
            }
    };

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Background Text */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5c6370',
                pointerEvents: 'none',
                zIndex: 0,
                userSelect: 'none',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'rgba(171, 178, 191, 0.4)' }}>Vault Overview</h2>
                <p style={{ color: 'rgba(92, 99, 112, 0.4)' }}>Select a note from the tree on the left to begin reading.</p>
                <p style={{ color: 'rgba(92, 99, 112, 0.4)' }}>Or click on a node in the Graph View on the right to navigate.</p>
            </div>

            {/* Foreground Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '3rem', height: '100%', overflowY: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#abb2bf', fontWeight: 600 }}>Folders</h2>
                
                {folders.length === 0 ? (
                    <p style={{ color: '#5c6370', fontStyle: 'italic' }}>No folders found in this vault.</p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {folders.map(folder => (
                            <div key={folder} style={{
                                backgroundColor: 'rgba(30, 30, 30, 0.6)',
                                border: '1px solid rgba(62, 68, 81, 0.5)',
                                borderRadius: '8px',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <span style={{ color: '#e9ecf4', fontWeight: 500, fontSize: '1.1rem' }}>{folder}</span>
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            setDeletingFolder(folder);
                                            setDeleteConfirmationInput('');
                                        }}
                                        style={{
                                            background: 'rgba(224, 108, 117, 0.1)',
                                            border: '1px solid rgba(224, 108, 117, 0.3)',
                                            borderRadius: '4px',
                                            color: '#e06c75',
                                            cursor: 'pointer',
                                            marginLeft: '1rem',
                                            padding: '4px 8px',
                                            fontSize: '0.8rem',
                                            opacity: deletingFolder === folder ? 0.5 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                        title="Delete Folder"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Folder Modal */}
            {deletingFolder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#282c34', padding: '2rem', borderRadius: '8px', 
                        border: '1px solid #3e4451', maxWidth: '400px', width: '100%',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}>
                        <h2 style={{ margin: '0 0 1rem 0', color: '#e06c75' }}>Delete Folder</h2>
                        <p style={{ color: '#abb2bf', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Are you sure you want to permanently delete the folder <strong>{deletingFolder}</strong>? 
                            This action cannot be undone.
                        </p>
                        <p style={{ color: '#abb2bf', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Please type <strong>delete</strong> to confirm:
                        </p>
                        <input 
                            value={deleteConfirmationInput}
                            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem', background: '#1e1e1e', 
                                border: '1px solid #444', borderRadius: '4px', color: '#fff',
                                marginBottom: '1.5rem'
                            }}
                            placeholder="delete"
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => { setDeletingFolder(null); setDeleteConfirmationInput(''); }}
                                style={{
                                    padding: '0.6rem 1.2rem', background: 'transparent',
                                    border: '1px solid #5c6370', borderRadius: '4px',
                                    color: '#abb2bf', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteFolder}
                                disabled={deleteConfirmationInput !== 'delete'}
                                style={{
                                    padding: '0.6rem 1.2rem', background: deleteConfirmationInput === 'delete' ? '#e06c75' : '#444',
                                    border: 'none', borderRadius: '4px',
                                    color: deleteConfirmationInput === 'delete' ? '#282c34' : '#777', cursor: deleteConfirmationInput === 'delete' ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                Delete Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
