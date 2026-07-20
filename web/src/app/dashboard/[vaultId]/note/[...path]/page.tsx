import React from 'react';
import { prisma } from '@/lib/prisma';
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';
import { decryptNote } from '@/lib/encryption';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, verifyVaultAccess } from '@/lib/auth';

import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton';

export default async function NotePage({ params }: { params: Promise<{ vaultId: string, path: string[] }> }) {
    const session = await getServerSession(authOptions);
    const { vaultId, path } = await params;
    const notePath = decodeURIComponent(path.join('/'));

    const { authorized, isOwner, allowedPaths } = await verifyVaultAccess(vaultId, session?.user);
    if (!authorized) return notFound();

    if (allowedPaths && !allowedPaths.includes(notePath)) {
        return notFound();
    }

    const note = await prisma.note.findUnique({
        where: { vaultId_path: { vaultId, path: notePath } },
        include: { attachments: { include: { attachment: true } }, vault: true }
    });

    if (!note) {
        return notFound();
    }

    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) throw new Error("MASTER_KEY is not configured.");

    let rawMarkdown = '';
    try {
        rawMarkdown = decryptNote(note.contentCiphertext);
    } catch (err) {
        return (
            <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
                <h1>Decryption Failed</h1>
                <p>Did you change your MASTER_KEY after uploading this note?</p>
            </div>
        );
    }

    // Build the attachment map for images: { "image.png": "https://cloudinary..." }
    const attachmentMap: Record<string, string> = {};
    for (const na of note.attachments) {
        if (na.filename && na.attachment.url) {
            attachmentMap[na.filename] = na.attachment.url;
        }
    }

    // Fetch all notes for this vault to resolve absolute paths for links
    const allNotes = await prisma.note.findMany({
        where: { vaultId },
        select: { path: true }
    });
    const vaultNotes = allNotes.map(n => n.path);

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #2d2d2d', paddingBottom: '0.5rem' }}>
                <h1 style={{ color: '#e5c07b', margin: 0 }}>
                    {note.path.split('/').pop()?.replace('.md', '')}
                </h1>
                {isOwner && <DeleteNoteButton noteId={note.id} vaultId={vaultId} />}
            </div>
            <MarkdownViewer content={rawMarkdown} attachmentMap={attachmentMap} vaultId={vaultId} vaultNotes={vaultNotes} />
        </div>
    );
}
