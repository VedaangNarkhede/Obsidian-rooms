'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TutorialSlider from './TutorialSlider';
import styles from './DashboardClient.module.css';

interface Vault {
    id: string;
    name: string;
    nickname: string | null;
    isSharedByMe: boolean;
    isGrantedToMe: boolean;
}

export default function DashboardClient({ allVaults }: { allVaults: Vault[] }) {
    const searchParams = useSearchParams();
    const currentTab = searchParams?.get('tab') || 'dashboard';
    const searchQuery = searchParams?.get('search')?.toLowerCase() || '';

    const [limit, setLimit] = useState(5);
    const [showOnlyShared, setShowOnlyShared] = useState(false);
    const [editingNickname, setEditingNickname] = useState<string | null>(null);
    const [nicknameInput, setNicknameInput] = useState('');
    const [isDeletingVault, setIsDeletingVault] = useState<Vault | null>(null);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
    const [editingVaultName, setEditingVaultName] = useState<string | null>(null);
    const [vaultNameInput, setVaultNameInput] = useState('');

    // Apply filtering
    let filteredVaults = allVaults;

    if (currentTab === 'my_vaults') {
        filteredVaults = filteredVaults.filter(v => !v.isGrantedToMe);
    } else if (currentTab === 'shared') {
        filteredVaults = filteredVaults.filter(v => v.isGrantedToMe);
    }

    if (showOnlyShared) {
        filteredVaults = filteredVaults.filter(v => v.isSharedByMe);
    }

    if (searchQuery) {
        filteredVaults = filteredVaults.filter(v => 
            v.name.toLowerCase().includes(searchQuery) || 
            (v.nickname && v.nickname.toLowerCase().includes(searchQuery))
        );
    }

    const paginatedVaults = filteredVaults.slice(0, limit);

    const handleSaveNickname = async (vaultId: string) => {
        await fetch(`/api/vaults/${vaultId}/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: nicknameInput })
        });
        window.location.reload(); // Quick refresh to grab new prefs globally
    };

    const handleDeleteVault = async () => {
        if (!isDeletingVault) return;
        if (deleteConfirmationInput !== 'delete') {
            alert('Please type "delete" to confirm.');
            return;
        }
        try {
            const res = await fetch(`/api/vaults/${isDeletingVault.id}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete vault');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDeletingVault(null);
            setDeleteConfirmationInput('');
        }
    };

    const handleSaveVaultName = async (vaultId: string) => {
        try {
            const res = await fetch(`/api/vaults/${vaultId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vaultName: vaultNameInput })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to rename vault');
            }
        } catch (err: any) {
            alert(err.message);
        }
        setEditingVaultName(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {currentTab === 'my_vaults' ? 'My Vaults' : currentTab === 'shared' ? 'Shared with Me' : 'Dashboard Overview'}
                </h1>
                
                {currentTab === 'my_vaults' && (
                    <button 
                        onClick={() => setShowOnlyShared(!showOnlyShared)}
                        style={{ 
                            background: showOnlyShared ? '#61afef' : 'transparent', 
                            border: '1px solid #61afef', 
                            color: showOnlyShared ? '#282c34' : '#61afef', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '20px', 
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {showOnlyShared ? 'Showing Shared' : 'Filter: Shared'}
                    </button>
                )}
            </div>
            
            {currentTab === 'dashboard' ? (
                <TutorialSlider />
            ) : filteredVaults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#5c6370', fontSize: '1.2rem' }}>
                    No results found.
                </div>
            ) : (
                <div className={styles.vaultList}>
                    {paginatedVaults.map(v => (
                        <div key={v.id} className={styles.vaultCard}>
                            <div className={styles.vaultInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Link 
                                        href={`/dashboard/${v.id}`}
                                        style={{ color: '#61afef', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}
                                    >
                                        {v.nickname || v.name}
                                    </Link>
                                    {v.isSharedByMe && (
                                        <span style={{ backgroundColor: '#61afef', color: '#282c34', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                            Shared
                                        </span>
                                    )}
                                </div>
                                {v.nickname && <span style={{ fontSize: '0.85rem', color: '#5c6370' }}>Original: {v.name}</span>}
                            </div>
                            
                            <div className={styles.vaultActions}>
                                {!v.isGrantedToMe && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {editingVaultName === v.id ? (
                                            <div className={styles.editRow}>
                                                <input 
                                                    value={vaultNameInput}
                                                    onChange={e => setVaultNameInput(e.target.value)}
                                                    placeholder="Vault Name"
                                                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#1e1e1e', color: '#fff' }}
                                                />
                                                <button onClick={() => handleSaveVaultName(v.id)} style={{ padding: '0.4rem', background: '#98c379', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#282c34' }}>Save</button>
                                                <button onClick={() => setEditingVaultName(null)} style={{ padding: '0.4rem', background: 'transparent', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', color: '#abb2bf' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setEditingVaultName(v.id); setVaultNameInput(v.name); }}
                                                style={{ background: 'transparent', border: '1px solid #444', color: '#abb2bf', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Rename
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                setIsDeletingVault(v);
                                                setDeleteConfirmationInput('');
                                            }}
                                            style={{ 
                                                background: 'transparent', border: '1px solid #e06c75', color: '#e06c75', 
                                                cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '4px'
                                            }}
                                            title="Delete Vault"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            
                                {v.isGrantedToMe && (
                                <div>
                                    {editingNickname === v.id ? (
                                        <div className={styles.editRow}>
                                            <input 
                                                value={nicknameInput}
                                                onChange={e => setNicknameInput(e.target.value)}
                                                placeholder="Nickname"
                                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#1e1e1e', color: '#fff' }}
                                            />
                                            <button onClick={() => handleSaveNickname(v.id)} style={{ padding: '0.4rem', background: '#98c379', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#282c34' }}>Save</button>
                                            <button onClick={() => setEditingNickname(null)} style={{ padding: '0.4rem', background: 'transparent', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', color: '#abb2bf' }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setEditingNickname(v.id); setNicknameInput(v.nickname || ''); }}
                                            style={{ background: 'transparent', border: '1px solid #444', color: '#abb2bf', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Edit Nickname
                                        </button>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredVaults.length > limit && (
                        <button 
                            onClick={() => setLimit(l => l + 5)}
                            style={{ 
                                alignSelf: 'center', 
                                marginTop: '1rem', 
                                padding: '0.8rem 2rem', 
                                background: '#3e4451', 
                                border: 'none', 
                                borderRadius: '6px', 
                                color: '#fff', 
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Show More
                        </button>
                    )}
                </div>
            )}
            
            {/* Delete Vault Modal */}
            {isDeletingVault && (
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
                        <h2 style={{ margin: '0 0 1rem 0', color: '#e06c75' }}>Delete Vault</h2>
                        <p style={{ color: '#abb2bf', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Are you sure you want to permanently delete the vault <strong>{isDeletingVault.name}</strong>? 
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
                                onClick={() => { setIsDeletingVault(null); setDeleteConfirmationInput(''); }}
                                style={{
                                    padding: '0.6rem 1.2rem', background: 'transparent',
                                    border: '1px solid #5c6370', borderRadius: '4px',
                                    color: '#abb2bf', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteVault}
                                disabled={deleteConfirmationInput !== 'delete'}
                                style={{
                                    padding: '0.6rem 1.2rem', background: deleteConfirmationInput === 'delete' ? '#e06c75' : '#444',
                                    border: 'none', borderRadius: '4px',
                                    color: deleteConfirmationInput === 'delete' ? '#282c34' : '#777', cursor: deleteConfirmationInput === 'delete' ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                Delete Vault
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
