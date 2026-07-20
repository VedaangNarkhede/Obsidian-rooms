import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, verifyVaultAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import VaultShell from './VaultShell';

export default async function VaultLayout({ children, params }: { children: React.ReactNode, params: Promise<{ vaultId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect('/login');

    const { vaultId } = await params;

    const vault = await prisma.vault.findUnique({
        where: { id: vaultId }
    });

    if (!vault) redirect('/dashboard');

    const { authorized, isOwner, allowedPaths } = await verifyVaultAccess(vaultId, session.user);
    if (!authorized) redirect('/dashboard');

    const notes = await prisma.note.findMany({
        where: { vaultId },
        include: { outgoingLinks: true }
    });

    const accessibleNotes = allowedPaths ? notes.filter(n => allowedPaths.includes(n.path)) : notes;

    const minimalNotes = accessibleNotes.map(n => ({
        id: n.id,
        path: n.path,
        hash: n.hash,
        outgoingLinks: n.outgoingLinks.map(l => l.targetPath)
    }));

    return (
        <VaultShell vaultId={vaultId} vaultName={vault.name} notes={minimalNotes} isOwner={isOwner}>
            {children}
        </VaultShell>
    );
}
