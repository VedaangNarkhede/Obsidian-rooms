import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vaultId } = await params;
    
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const grantAll = body.grantAll !== undefined ? Boolean(body.grantAll) : true;
    const grantedPaths = body.grantedPaths ? JSON.stringify(body.grantedPaths) : null;

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Ensure the current user owns this vault
    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
        return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    if (vault.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Only the vault owner can grant access' }, { status: 403 });
    }

    // Check if grant already exists
    const existing = await prisma.grant.findUnique({
        where: { vaultId_email: { vaultId, email } }
    });

    if (existing) {
        return NextResponse.json({ error: 'User already has access to this vault' }, { status: 400 });
    }

    const newGrant = await prisma.grant.create({
        data: {
            vaultId,
            email,
            grantAll,
            grantedPaths
        }
    });

    return NextResponse.json({ success: true, grant: newGrant });
}

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
        return NextResponse.json({ error: 'Only the vault owner can view grants' }, { status: 403 });
    }

    const grants = await prisma.grant.findMany({
        where: { vaultId },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ grants });
}
