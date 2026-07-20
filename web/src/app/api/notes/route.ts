import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, verifyVaultAccess } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vaultId = searchParams.get('vaultId');

    if (!vaultId) {
        return NextResponse.json({ error: 'vaultId is required' }, { status: 400 });
    }

    // Verify user has access to this vault
    const { authorized } = await verifyVaultAccess(vaultId, session.user);

    if (!authorized) {
        return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 });
    }

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
        return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    // Fetch all notes, their attachments, and their links
    const notes = await prisma.note.findMany({
        where: { vaultId: vault.id },
        include: {
            attachments: {
                include: { attachment: true }
            },
            outgoingLinks: true
        }
    });

    // We do NOT return the `contentCiphertext` in this bulk endpoint to save bandwidth.
    // The client will fetch individual note content via a separate endpoint or by directly selecting a note.
    const minimalNotes = notes.map(n => ({
        id: n.id,
        path: n.path,
        hash: n.hash,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        outgoingLinks: n.outgoingLinks.map(l => l.targetPath)
    }));

    return NextResponse.json({ notes: minimalNotes });
}
