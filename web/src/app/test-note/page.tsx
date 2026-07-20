import React from 'react';
import { prisma } from '@/lib/prisma';
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';
import { decryptNote } from '@/lib/encryption';

export default async function TestNotePage() {
    // For testing purposes, just grab the very first note in the database
    const note = await prisma.note.findFirst({
        include: {
            attachments: {
                include: { attachment: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!note) {
        return (
            <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
                <h1>No notes found in the database.</h1>
                <p>Please use your Obsidian Plugin to sync a note first!</p>
            </div>
        );
    }

    // Decrypt the note
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) {
        throw new Error("MASTER_KEY is not configured.");
    }

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
    
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#1e1e1e' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '1rem' }}>
                <h1 style={{ color: 'white' }}>Rendered Note: {note.path}</h1>
            </div>
            
            <MarkdownViewer content={rawMarkdown} attachmentMap={attachmentMap} />
        </div>
    );
}
