'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ShareVaultModal.module.css';

interface Grant {
    id: string;
    email: string;
    grantAll: boolean;
    grantedPaths: string | null;
    createdAt: string;
}

interface ShareVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    vaultId: string;
    vaultName: string;
}

export default function ShareVaultModal({ isOpen, onClose, vaultId, vaultName }: ShareVaultModalProps) {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [allNotes, setAllNotes] = useState<string[]>([]);
    
    // Slider Steps
    const [step, setStep] = useState<0 | 1>(0); // 0 = Email, 1 = Config

    // UI States
    const [shareEmail, setShareEmail] = useState('');
    const [shareMessage, setShareMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [noteSearchQuery, setNoteSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Inline confirmation states
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Note Selection States
    const [isGrantAll, setIsGrantAll] = useState(true);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    
    // Editing state
    const [editingGrantId, setEditingGrantId] = useState<string | null>(null);

    const itemsPerPage = 3;

    useEffect(() => {
        if (isOpen) {
            fetchGrants();
            fetchNotes();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setStep(0);
        setShareMessage('');
        setShareEmail('');
        setSearchQuery('');
        setNoteSearchQuery('');
        setCurrentPage(1);
        setIsGrantAll(true);
        setSelectedPaths(new Set());
        setEditingGrantId(null);
        setRevokingId(null);
    };

    const fetchGrants = async () => {
        const res = await fetch(`/api/vaults/${vaultId}/grants`);
        if (res.ok) {
            const data = await res.json();
            setGrants(data.grants || []);
        }
    };

    const fetchNotes = async () => {
        const res = await fetch(`/api/vaults/${vaultId}/notes`);
        if (res.ok) {
            const data = await res.json();
            setAllNotes(data.notes || []);
            // Initialize selectedPaths with all notes by default
            setSelectedPaths(new Set(data.notes || []));
        }
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!shareEmail.trim()) return;
        setStep(1); // Slide to config
    };

    const handleShare = async () => {
        setShareMessage('Saving access...');
        
        const payload = {
            email: shareEmail,
            grantAll: isGrantAll,
            grantedPaths: isGrantAll ? null : Array.from(selectedPaths)
        };
        
        try {
            let res;
            if (editingGrantId) {
                res = await fetch(`/api/vaults/${vaultId}/grants/${editingGrantId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/vaults/${vaultId}/grants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            const data = await res.json();
            
            if (data.error) {
                setShareMessage(data.error);
            } else {
                setShareMessage(editingGrantId ? `Updated access for ${shareEmail}!` : `Access granted to ${shareEmail}!`);
                setTimeout(() => resetForm(), 1500);
                fetchGrants();
            }
        } catch (err) {
            setShareMessage('Failed to share vault.');
        }
    };

    const handleRevoke = async (grantId: string) => {
        const res = await fetch(`/api/vaults/${vaultId}/grants/${grantId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            setRevokingId(null);
            fetchGrants();
        }
    };

    const handleEdit = (grant: Grant) => {
        setEditingGrantId(grant.id);
        setShareEmail(grant.email);
        setIsGrantAll(grant.grantAll);
        
        if (grant.grantedPaths) {
            try {
                const paths = JSON.parse(grant.grantedPaths);
                setSelectedPaths(new Set(paths));
            } catch (e) {
                setSelectedPaths(new Set());
            }
        } else {
            // If it was grantAll, they have all notes selected
            setSelectedPaths(new Set(allNotes));
        }
        
        setStep(1); // Jump directly to config step
    };

    const handleToggleNote = (path: string) => {
        const newSet = new Set(selectedPaths);
        if (newSet.has(path)) {
            newSet.delete(path);
            setIsGrantAll(false);
        } else {
            newSet.add(path);
            if (newSet.size === allNotes.length) {
                setIsGrantAll(true);
            }
        }
        setSelectedPaths(newSet);
    };

    const handleToggleAll = (checked: boolean) => {
        setIsGrantAll(checked);
        if (checked) {
            setSelectedPaths(new Set(allNotes));
        } else {
            setSelectedPaths(new Set());
        }
    };

    const filteredGrants = grants.filter(g => g.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalPages = Math.ceil(filteredGrants.length / itemsPerPage);
    const paginatedGrants = filteredGrants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const filteredNotes = allNotes.filter(n => n.toLowerCase().includes(noteSearchQuery.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Vault">
            <p style={{ color: '#abb2bf', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Grant users access to <strong>{vaultName}</strong>.
            </p>
            
            <div className={styles.formContainer}>
                {step === 0 ? (
                    <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h3 style={{ color: '#e5c07b', margin: 0, fontSize: '1.1rem' }}>Add User</h3>
                        <div className={styles.inputGroup}>
                            <input 
                                type="email" 
                                value={shareEmail}
                                onChange={e => setShareEmail(e.target.value)}
                                placeholder="friend@example.com" 
                                required
                                className={styles.emailInput}
                            />
                            <button type="submit" className={styles.primaryBtn}>
                                Next &rarr;
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button type="button" onClick={() => setStep(0)} className={styles.backBtn}>
                            &larr; Back to Email
                        </button>
                        
                        <h3 style={{ color: '#61afef', margin: 0, marginBottom: '0.5rem' }}>Access for {shareEmail}</h3>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e5c07b', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                            <input 
                                type="checkbox" 
                                checked={isGrantAll}
                                onChange={(e) => handleToggleAll(e.target.checked)}
                                style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            Select All Notes (Default)
                        </label>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input 
                                type="text"
                                placeholder="Search notes to share..."
                                value={noteSearchQuery}
                                onChange={e => setNoteSearchQuery(e.target.value)}
                                className={styles.noteSearch}
                            />
                            <div className={styles.notesList}>
                                {filteredNotes.length === 0 ? (
                                    <p style={{ color: '#abb2bf', fontStyle: 'italic', fontSize: '0.9rem' }}>No notes found.</p>
                                ) : (
                                    filteredNotes.map(note => (
                                        <label key={note} className={styles.noteItem}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedPaths.has(note)}
                                                onChange={() => handleToggleNote(note)}
                                            />
                                            {note}
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={styles.inputGroup} style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
                            <span style={{ color: shareMessage.includes('Failed') ? '#e06c75' : '#98c379', fontSize: '0.9rem', flex: 1 }}>
                                {shareMessage}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={resetForm} className={styles.secondaryBtn}>Cancel</button>
                                <button type="button" onClick={handleShare} className={styles.primaryBtn}>
                                    {editingGrantId ? 'Update Access' : 'Confirm Share'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#e5c07b', fontSize: '1.1rem', marginBottom: '1rem' }}>Shared With</h3>
                
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search shared users by email..."
                    style={{ 
                        width: '100%',
                        padding: '0.6rem', 
                        borderRadius: '4px', 
                        border: '1px solid #333', 
                        background: '#1e1e1e', 
                        color: '#fff',
                        outline: 'none',
                        marginBottom: '1rem'
                    }}
                />

                {filteredGrants.length === 0 ? (
                    <p style={{ color: '#abb2bf', fontStyle: 'italic', fontSize: '0.9rem' }}>No users found.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {paginatedGrants.map(grant => (
                            <div key={grant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#282c34', padding: '0.75rem', borderRadius: '4px', border: '1px solid #3e4451', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden', minWidth: '150px' }}>
                                    <span style={{ color: '#abb2bf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grant.email}</span>
                                    <span style={{ color: '#5c6370', fontSize: '0.8rem' }}>
                                        {grant.grantAll ? 'All Notes Access' : 'Specific Notes Access'}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleEdit(grant)}
                                        title="Edit Access"
                                        style={{ background: 'transparent', border: '1px solid #61afef', color: '#61afef', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                    >
                                        Edit
                                    </button>
                                    
                                    {revokingId === grant.id ? (
                                        <button 
                                            onClick={() => handleRevoke(grant.id)}
                                            style={{ background: '#e06c75', border: '1px solid #e06c75', color: '#282c34', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                                        >
                                            Confirm Revoke
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setRevokingId(grant.id)}
                                            title="Revoke Access"
                                            style={{ background: 'transparent', border: '1px solid #e06c75', color: '#e06c75', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            style={{ background: 'none', border: '1px solid #444', color: currentPage === 1 ? '#555' : '#61afef', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <span style={{ color: '#abb2bf', fontSize: '0.9rem' }}>Page {currentPage} of {totalPages}</span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            style={{ background: 'none', border: '1px solid #444', color: currentPage === totalPages ? '#555' : '#61afef', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
