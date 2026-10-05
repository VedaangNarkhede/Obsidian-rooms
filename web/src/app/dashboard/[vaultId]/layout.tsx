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

    const [authResult, notes] = await Promise.all([
        verifyVaultAccess(vaultId, session.user),
        prisma.note.findMany({
            where: { vaultId },
            include: { outgoingLinks: true }
        })
    ]);

    const { authorized, isOwner, allowedPaths, vault: authVault } = authResult;
    if (!authorized || !authVault) redirect('/dashboard');

    if (authVault.isPublic && !isOwner) {
        await prisma.publicVaultView.upsert({
            where: { userId_vaultId: { userId: session.user.id, vaultId } },
            update: { viewedAt: new Date() },
            create: { userId: session.user.id, vaultId }
        });
    }

    const accessibleNotes = allowedPaths ? notes.filter(n => allowedPaths.includes(n.path)) : notes;

    const minimalNotes = accessibleNotes.map(n => ({
        id: n.id,
        path: n.path,
        hash: n.hash,
        outgoingLinks: n.outgoingLinks.map(l => l.targetPath)
    }));

    return (
        <VaultShell vaultId={vaultId} vaultName={authVault.name} notes={minimalNotes} isOwner={isOwner} isPublic={authVault.isPublic}>
            {children}
        </VaultShell>
    );
}
