'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './VaultShell.module.css';
import ShareVaultModal from '@/components/vault/ShareVaultModal';

// Lazy load graph to prevent SSR hydration errors
const LocalGraph = dynamic(() => import('@/components/graph/LocalGraph'), { ssr: false });

interface MinimalNote {
    id: string;
    path: string;
    hash: string;
    outgoingLinks: string[];
}

interface TreeNode {
    path: string;
    basename: string;
    isBackLink: boolean;
    children: TreeNode[];
}

interface VaultShellProps {
    vaultId: string;
    vaultName: string;
    notes: MinimalNote[];
    isOwner: boolean;
    children: React.ReactNode;
}

const getBasename = (p: string) => {
    let name = p.split('/').pop() || p;
    if (name.endsWith('.md')) name = name.slice(0, -3);
    return name;
};

export default function VaultShell({ vaultId, vaultName, notes, isOwner, children }: VaultShellProps) {
    const pathname = usePathname();
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    
    // Extract current note path from URL (e.g. /dashboard/vaultId/note/Folder/File.md -> Folder/File.md)
    let currentNotePath = '';
    const notePrefix = `/dashboard/${vaultId}/note/`;
    if (pathname && pathname.startsWith(notePrefix)) {
        currentNotePath = decodeURIComponent(pathname.substring(notePrefix.length));
    }

    // Simple Folder Grouping
    const groupedNotes = useMemo(() => {
        if (notes.length === 0) return { rootNotes: [], folders: {} as Record<string, MinimalNote[]> };
        const rootNotes: MinimalNote[] = [];
        const folders: Record<string, MinimalNote[]> = {};
        for (const n of notes) {
            const parts = n.path.split('/');
            if (parts.length > 1) {
                const folder = parts[0];
                if (!folders[folder]) folders[folder] = [];
                folders[folder].push(n);
            } else {
                rootNotes.push(n);
            }
        }
        
        // Sorting function
        const sortNotes = (arr: MinimalNote[]) => {
            return arr.sort((a, b) => {
                const aName = getBasename(a.path).toLowerCase();
                const bName = getBasename(b.path).toLowerCase();
                if (aName === 'index') return -1;
                if (bName === 'index') return 1;
                return aName.localeCompare(bName);
            });
        };

        // Sort root and folders
        sortNotes(rootNotes);
        for (const folder in folders) {
            sortNotes(folders[folder]);
        }

        return { rootNotes, folders };
    }, [notes]);

    const toggleFolder = (folder: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(folder)) newSet.delete(folder);
        else newSet.add(folder);
        setExpandedFolders(newSet);
    };

    // Render Folder Tree
    const renderFolders = () => {
        return (
            <div className={styles.folderList}>
                {groupedNotes.rootNotes.map((note, i) => (
                    <div key={`${note.path}-${i}`} className={styles.treeItem} style={{ padding: '0 8px' }}>
                        <Link 
                            href={`/dashboard/${vaultId}/note/${note.path.split('/').map(encodeURIComponent).join('/')}`}
                            className={`${styles.treeLink} ${note.path === currentNotePath ? styles.active : ''}`}
                            onClick={() => setIsLeftSidebarOpen(false)}
                        >
                            {getBasename(note.path)}
                        </Link>
                    </div>
                ))}
                {/* Folders (Sorted alphabetically) */}
                {Object.keys(groupedNotes.folders).sort((a, b) => a.localeCompare(b)).map(folder => {
                    const isExpanded = expandedFolders.has(folder);
                    const folderNotes = groupedNotes.folders[folder];
                    return (
                        <div key={folder} className={styles.folderGroup}>
                            <div 
                                className={styles.folderHeader} 
                                onClick={() => toggleFolder(folder)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <span style={{ fontSize: '0.8rem', color: '#abb2bf', display: 'inline-block', width: '16px', textAlign: 'center' }}>{isExpanded ? '▼' : '▶'}</span>
                                <span style={{ fontWeight: 500 }}>{folder}</span>
                            </div>
                            {isExpanded && (
                                <ul className={styles.treeList}>
                                    {folderNotes.map((note, i) => (
                                        <li key={`${note.path}-${i}`} className={styles.treeItem}>
                                            <Link 
                                                href={`/dashboard/${vaultId}/note/${note.path.split('/').map(encodeURIComponent).join('/')}`}
                                                className={`${styles.treeLink} ${note.path === currentNotePath ? styles.active : ''}`}
                                                onClick={() => setIsLeftSidebarOpen(false)}
                                            >
                                                {getBasename(note.path)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.shell}>
            {/* Left Sidebar: Virtual Tree */}
            <aside className={`${styles.leftSidebar} ${isLeftSidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Link href={`/dashboard/${vaultId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <h2>{vaultName}</h2>
                        </Link>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {isOwner && (
                                <button 
                                    onClick={() => setIsShareOpen(true)}
                                    style={{ background: 'none', border: '1px solid #444', color: '#abb2bf', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Share
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.sidebarContent}>
                    {notes.length === 0 ? (
                        <p className={styles.emptyMsg}>No notes in this vault.</p>
                    ) : (
                        renderFolders()
                    )}
                </div>
            </aside>

            {/* Center Content: Markdown Viewer */}
            <section className={styles.centerContent} onClick={() => {
                if (isLeftSidebarOpen) setIsLeftSidebarOpen(false);
                if (isRightSidebarOpen) setIsRightSidebarOpen(false);
            }}>
                <div className={styles.mobileToggleBar}>
                    <button className={styles.mobileBtn} onClick={(e) => { e.stopPropagation(); setIsLeftSidebarOpen(!isLeftSidebarOpen); }}>
                        ☰ Folders
                    </button>
                    <button className={styles.mobileBtn} onClick={(e) => { e.stopPropagation(); setIsRightSidebarOpen(!isRightSidebarOpen); }}>
                        Graph ⤢
                    </button>
                </div>
                {children}
            </section>

            {/* Right Sidebar: Local Graph */}
            <aside className={`${styles.rightSidebar} ${isRightSidebarOpen ? styles.open : ''} ${isGraphFullscreen ? styles.fullscreenOverlay : ''}`}>
                <div className={styles.sidebarHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Local Graph</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                            className={styles.mobileOnlyBtn}
                            onClick={() => setIsRightSidebarOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: '#abb2bf', cursor: 'pointer', fontSize: '1rem', padding: '0 0.5rem' }}
                            title="Close Graph"
                        >
                            ✕
                        </button>
                        <button 
                            onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                            style={{ background: 'transparent', border: '1px solid #444', color: '#abb2bf', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                            title="Toggle Fullscreen"
                        >
                            {isGraphFullscreen ? '⤢' : '⤢'}
                        </button>
                    </div>
                </div>
                <div className={styles.graphContainer}>
                    <LocalGraph 
                        currentNotePath={currentNotePath} 
                        vaultId={vaultId} 
                        notes={notes} 
                    />
                </div>
            </aside>

            {/* Share Vault Modal */}
            <ShareVaultModal 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                vaultId={vaultId} 
                vaultName={vaultName} 
            />
        </div>
    );
}
