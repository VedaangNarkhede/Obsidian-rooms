import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vaultId } = await params;

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
        return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    if (vault.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Only the vault owner can list notes for access control' }, { status: 403 });
    }

    const notes = await prisma.note.findMany({
        where: { vaultId },
        select: { path: true },
        orderBy: { path: 'asc' }
    });

    return NextResponse.json({ notes: notes.map(n => n.path) });
}
