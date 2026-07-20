import React from 'react';
import Link from 'next/link';

export default async function MissingNotePage({
    params,
    searchParams
}: {
    params: Promise<{ vaultId: string }>;
    searchParams: Promise<{ path?: string }>;
}) {
    const { vaultId } = await params;
    const { path } = await searchParams;
    const decodedPath = decodeURIComponent(path || 'Unknown Note');

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#888',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e93147" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <h1 style={{ color: '#e5c07b', marginBottom: '1rem' }}>Note Not Found</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#abb2bf' }}>
                The file <strong style={{ color: '#61afef' }}>{decodedPath}</strong> is not present in this vault.
            </p>
            <p style={{ marginBottom: '2rem' }}>
                Please ask the owner to re-sync it from Obsidian.
            </p>
            <Link 
                href={`/dashboard/${vaultId}`}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#abb2bf',
                    textDecoration: 'none'
                }}
            >
                Return to Dashboard
            </Link>
        </div>
    );
}
