'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TutorialSlider from './TutorialSlider';

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

    return (
        <div style={{ padding: '3rem', width: '100%', maxWidth: '900px', margin: '0 auto', color: '#abb2bf' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: '#ffffff', fontSize: '2rem', margin: 0 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paginatedVaults.map(v => (
                        <div key={v.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.2rem',
                            backgroundColor: '#282c34',
                            border: '1px solid #3e4451',
                            borderRadius: '8px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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

                            {v.isGrantedToMe && (
                                <div>
                                    {editingNickname === v.id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>
    );
}
