'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './DynamicNavbar.module.css';

export interface VaultDisplay {
    id: string;
    name: string;
    nickname: string | null;
}

interface DynamicNavbarProps {
    vaults: VaultDisplay[];
    ownedVaultIds: string[];
    username: string;
}

export default function DynamicNavbar({ vaults, ownedVaultIds, username }: DynamicNavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Use dashboard if no tab specified
    const currentTab = searchParams.get('tab') || 'dashboard'; 
    const searchQuery = searchParams.get('search') || '';

    // Logic for Opened Vaults
    const match = pathname?.match(/^\/dashboard\/([^/]+)/);
    const openedVaultId = match ? match[1] : null;
    const isSettings = pathname?.includes('/settings');

    const [recentVaults, setRecentVaults] = useState<string[]>([]);
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local search when URL changes externally
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce pushing to router
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams?.toString() || '');
            if (localSearch !== searchQuery) {
                if (localSearch) params.set('search', localSearch);
                else params.delete('search');
                
                router.push(`/dashboard?${params.toString()}`);
            }
        }, 300); // 300ms debounce
        
        return () => clearTimeout(timer);
    }, [localSearch, searchParams, searchQuery, router]);

    useEffect(() => {
        const stored = localStorage.getItem('recentVaults');
        if (stored) {
            try {
                setRecentVaults(JSON.parse(stored));
            } catch (e) {
                setRecentVaults([]);
            }
        }
    }, []);

    useEffect(() => {
        if (openedVaultId && openedVaultId !== 'settings' && vaults.some(v => v.id === openedVaultId)) {
            setRecentVaults(prev => {
                let newQueue = prev.filter(id => id !== openedVaultId);
                newQueue.unshift(openedVaultId);
                if (newQueue.length > 4) newQueue = newQueue.slice(0, 4);
                localStorage.setItem('recentVaults', JSON.stringify(newQueue));
                return newQueue;
            });
        }
    }, [openedVaultId, vaults]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
    };

    const handleTabSwitch = (tab: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('tab', tab);
        params.delete('search');
        router.push(`/dashboard?${params.toString()}`);
    };

    const getVaultName = (id: string) => {
        const v = vaults.find(v => v.id === id);
        if (!v) return 'Unknown Vault';
        return v.nickname || v.name;
    };

    const isShared = (id: string) => !ownedVaultIds.includes(id);

    let tabs = [];
    
    const myVaultsTab = { id: 'my_vaults', label: 'My Vaults', active: currentTab === 'my_vaults' && !openedVaultId, isOpenedVault: false, link: '' };
    const sharedTab = { id: 'shared', label: 'Shared with Me', active: currentTab === 'shared' && !openedVaultId, isOpenedVault: false, link: '' };
    
    // Only show valid recent vaults that exist in the list
    const validRecents = recentVaults.filter(id => vaults.some(v => v.id === id));
    
    // Auto-cleanup stale localStorage
    useEffect(() => {
        if (recentVaults.length !== validRecents.length) {
            localStorage.setItem('recentVaults', JSON.stringify(validRecents));
        }
    }, [recentVaults, validRecents]);

    const renderedRecent = validRecents.map(id => ({
        id: `vault_${id}`,
        label: getVaultName(id),
        link: `/dashboard/${id}`,
        active: openedVaultId === id,
        isOpenedVault: true
    }));

    if (openedVaultId && openedVaultId !== 'settings') {
        const currentlyOpenedIsShared = isShared(openedVaultId);
        if (currentlyOpenedIsShared) {
            // Replace Shared with Me -> [My Vaults, Opened Vaults]
            tabs = [myVaultsTab, ...renderedRecent];
        } else {
            // Replace My Vaults -> [Opened Vaults, Shared with Me]
            tabs = [...renderedRecent, sharedTab];
        }
    } else {
        tabs = [myVaultsTab, sharedTab];
    }

    return (
        <header className={styles.topNav}>
            <div className={styles.navLeft}>
                <Link href="/dashboard" className={styles.logo} onClick={() => {
                    const params = new URLSearchParams();
                    params.set('tab', 'dashboard');
                    router.push(`/dashboard?${params.toString()}`);
                }}>
                    Obsidian Rooms
                </Link>
                
                <div className={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        tab.isOpenedVault ? (
                            <Link key={tab.id} href={tab.link!} className={`${styles.tab} ${tab.active ? styles.activeTab : ''}`}>
                                {tab.label}
                            </Link>
                        ) : (
                            <button key={tab.id} className={`${styles.tab} ${tab.active ? styles.activeTab : ''}`} onClick={() => handleTabSwitch(tab.id)}>
                                {tab.label}
                            </button>
                        )
                    ))}
                </div>

                <div className={styles.searchContainer}>
                    <input 
                        type="text" 
                        placeholder="Search vaults..." 
                        value={localSearch}
                        onChange={handleSearch}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.navRight}>
                <span className={styles.username}>{username}</span>
                <Link href="/dashboard/settings" className={styles.settingsLink}>Settings</Link>
                <Link href="/api/auth/signout" className={styles.logoutLink}>Sign Out</Link>
            </div>
        </header>
    );
}
