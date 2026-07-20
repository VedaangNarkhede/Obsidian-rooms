import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, grantId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vaultId, grantId } = await params;

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
        return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    if (vault.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Only the vault owner can revoke grants' }, { status: 403 });
    }

    await prisma.grant.deleteMany({
        where: { id: grantId, vaultId }
    });

    return NextResponse.json({ success: true });
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string, grantId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vaultId, grantId } = await params;
    
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
        return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    if (vault.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Only the vault owner can edit grants' }, { status: 403 });
    }

    const grantAll = body.grantAll !== undefined ? Boolean(body.grantAll) : true;
    const grantedPaths = body.grantedPaths ? JSON.stringify(body.grantedPaths) : null;

    const updatedGrant = await prisma.grant.updateMany({
        where: { id: grantId, vaultId },
        data: {
            grantAll,
            grantedPaths
        }
    });

    if (updatedGrant.count === 0) {
        return NextResponse.json({ error: 'Grant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
