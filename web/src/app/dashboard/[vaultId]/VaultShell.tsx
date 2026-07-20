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

export default function VaultShell({ vaultId, vaultName, notes, isOwner, children }: VaultShellProps) {
    const pathname = usePathname();
    const [isShareOpen, setIsShareOpen] = useState(false);
    
    // Extract current note path from URL (e.g. /dashboard/vaultId/note/Folder/File.md -> Folder/File.md)
    let currentNotePath = '';
    const notePrefix = `/dashboard/${vaultId}/note/`;
    if (pathname && pathname.startsWith(notePrefix)) {
        currentNotePath = decodeURI(pathname.substring(notePrefix.length));
    }

    // --- VIRTUAL LINK TREE ALGORITHM ---
    const treeData = useMemo(() => {
        if (notes.length === 0) return [];

        const roots: TreeNode[] = [];
        const inDegree = new Map<string, number>();
        const noteMap = new Map<string, MinimalNote>();

        // Init
        for (const n of notes) {
            inDegree.set(n.path, 0);
            noteMap.set(n.path, n);
        }

        // Calculate In-Degrees
        for (const n of notes) {
            for (const target of n.outgoingLinks) {
                if (inDegree.has(target)) {
                    inDegree.set(target, (inDegree.get(target) || 0) + 1);
                }
            }
        }

        // Find potential roots (0 incoming links, or named index/readme)
        let startingPaths = notes.filter(n => {
            const deg = inDegree.get(n.path) || 0;
            const lower = n.path.toLowerCase();
            const isIndex = lower.includes('index') || lower.includes('readme') || lower.includes('00');
            return deg === 0 || isIndex;
        }).map(n => n.path);

        // Fallback: If no roots found (circular graph), just pick the first note
        if (startingPaths.length === 0) {
            startingPaths = [notes[0].path];
        }

        const getBasename = (p: string) => {
            let name = p.split('/').pop() || p;
            if (name.endsWith('.md')) name = name.slice(0, -3);
            return name;
        };

        // DFS Traversal
        const buildNode = (path: string, visitedPath: Set<string>): TreeNode | null => {
            if (!noteMap.has(path)) return null;

            // Cycle detection
            if (visitedPath.has(path)) {
                return {
                    path,
                    basename: `↺ ${getBasename(path)}`,
                    isBackLink: true,
                    children: []
                };
            }

            const currentVisited = new Set(visitedPath);
            currentVisited.add(path);

            const note = noteMap.get(path)!;
            const children: TreeNode[] = [];

            for (const target of note.outgoingLinks) {
                const childNode = buildNode(target, currentVisited);
                if (childNode) children.push(childNode);
            }

            return {
                path,
                basename: getBasename(path),
                isBackLink: false,
                children
            };
        };

        const globalVisited = new Set<string>(); // Keep track of rendered roots so we don't duplicate
        
        for (const p of startingPaths) {
            if (globalVisited.has(p)) continue;
            const node = buildNode(p, new Set());
            if (node) {
                roots.push(node);
                // Mark all children recursively as "globally visited" if we wanted a true partition, 
                // but since it's a DAG/Graph, just rendering from the root is enough.
                globalVisited.add(p);
            }
        }

        return roots;
    }, [notes]);

    // Recursive Tree Renderer
    const renderTree = (nodes: TreeNode[], depth: number = 0) => {
        return (
            <ul className={styles.treeList} style={{ paddingLeft: depth === 0 ? '0' : '1rem' }}>
                {nodes.map((node, i) => (
                    <li key={`${node.path}-${i}`} className={styles.treeItem}>
                        <Link 
                            href={`/dashboard/${vaultId}/note/${node.path}`}
                            className={`${styles.treeLink} ${node.path === currentNotePath ? styles.active : ''} ${node.isBackLink ? styles.backlink : ''}`}
                        >
                            {node.basename}
                        </Link>
                        {!node.isBackLink && node.children.length > 0 && (
                            renderTree(node.children, depth + 1)
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className={styles.shell}>
            {/* Left Sidebar: Virtual Tree */}
            <aside className={styles.leftSidebar}>
                <div className={styles.sidebarHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{vaultName}</h2>
                    {isOwner && (
                        <button 
                            onClick={() => setIsShareOpen(true)}
                            style={{ background: 'none', border: '1px solid #444', color: '#abb2bf', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            Share
                        </button>
                    )}
                </div>
                <div className={styles.sidebarContent}>
                    {notes.length === 0 ? (
                        <p className={styles.emptyMsg}>No notes in this vault.</p>
                    ) : (
                        renderTree(treeData)
                    )}
                </div>
            </aside>

            {/* Center Content: Markdown Viewer */}
            <section className={styles.centerContent}>
                {children}
            </section>

            {/* Right Sidebar: Local Graph */}
            <aside className={styles.rightSidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Local Graph</h2>
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
