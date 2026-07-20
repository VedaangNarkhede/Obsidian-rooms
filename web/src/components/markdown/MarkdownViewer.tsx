'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';
import styles from './MarkdownViewer.module.css';
import Link from 'next/link';
import { MermaidGraph } from './MermaidGraph';

import { preprocessObsidianMarkdown } from '@/lib/markdown';

interface MarkdownViewerProps {
    content: string;
    // Map of attachment original local path (or hash) to its Cloudinary URL
    attachmentMap?: Record<string, string>;
    vaultId?: string;
    vaultNotes?: string[];
}

export function MarkdownViewer({ content, attachmentMap = {}, vaultId, vaultNotes }: MarkdownViewerProps) {
    
    // Preprocess Obsidian-specific syntax into standard Markdown
    const processedContent = useMemo(() => preprocessObsidianMarkdown(content, attachmentMap), [content, attachmentMap]);

    return (
        <div className={styles.markdownContainer}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: 'ignore' }]]}
                components={{
                    a({ node, href, children, ...props }: any) {
                        // If it's a relative link (like a note), route it through the dashboard
                        if (vaultId && href && !href.startsWith('http') && !href.startsWith('#')) {
                            // Decode URI because href might be Note%202.md
                            const decodedHref = decodeURI(href);
                            const linkBasename = decodedHref.split('/').pop() || decodedHref;
                            
                            // Find the exact path in the vault
                            let finalPath = decodedHref;
                            if (vaultNotes) {
                                const normalize = (s: string) => s.toLowerCase().replace(/\.md$/, '');
                                const linkNorm = normalize(decodedHref);
                                const linkBaseNorm = normalize(linkBasename);
                                
                                const matched = vaultNotes.find(p => {
                                    const pNorm = normalize(p);
                                    return pNorm === linkNorm || pNorm.endsWith('/' + linkBaseNorm) || pNorm === linkBaseNorm;
                                });
                                if (matched) {
                                    finalPath = matched;
                                } else {
                                    // If note is missing, route to the missing page
                                    return (
                                        <Link 
                                            href={`/dashboard/${vaultId}/missing?path=${encodeURIComponent(linkBasename)}`}
                                            style={{ color: '#888', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                            title="Note not found in vault"
                                        >
                                            {children}
                                        </Link>
                                    );
                                }
                            }
                            
                            return <Link href={`/dashboard/${vaultId}/note/${encodeURI(finalPath)}`} {...props}>{children}</Link>;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                    },
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        
                        if (!inline && match && match[1] === 'mermaid') {
                            return <MermaidGraph chart={String(children).replace(/\n$/, '')} />;
                        }

                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code {...props} className={className}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
