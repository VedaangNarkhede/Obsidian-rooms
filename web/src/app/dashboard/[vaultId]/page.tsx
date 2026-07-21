import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, verifyVaultAccess } from '@/lib/auth';
import VaultOverviewClient from '@/components/vault/VaultOverviewClient';

export default async function VaultDashboardEmptyState({ params }: { params: Promise<{ vaultId: string }> }) {
    const { vaultId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const { isOwner, allowedPaths } = await verifyVaultAccess(vaultId, session.user);

    const notes = await prisma.note.findMany({
        where: { vaultId },
        select: { path: true }
    });

    const accessibleNotes = allowedPaths ? notes.filter(n => allowedPaths.includes(n.path)) : notes;
    const folders = new Set<string>();
    accessibleNotes.forEach(n => {
        const parts = n.path.split('/');
        if (parts.length > 1) {
            folders.add(parts[0]);
        }
    });

    return <VaultOverviewClient vaultId={vaultId} folders={Array.from(folders)} isOwner={isOwner} />;
}
