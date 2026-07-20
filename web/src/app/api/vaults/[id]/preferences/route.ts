import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vaultId } = await params;
    const body = await req.json();
    const nickname = body.nickname?.trim() || null;

    const vault = await prisma.vault.findFirst({
        where: {
            id: vaultId,
            OR: [
                { userId: (session.user as any).id },
                { grants: { some: { email: session.user.email || '' } } }
            ]
        }
    });

    if (!vault) {
        return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 });
    }

    const pref = await prisma.vaultPreference.upsert({
        where: {
            userId_vaultId: {
                userId: (session.user as any).id,
                vaultId: vaultId
            }
        },
        update: {
            nickname: nickname
        },
        create: {
            userId: (session.user as any).id,
            vaultId: vaultId,
            nickname: nickname
        }
    });

    return NextResponse.json({ success: true, nickname: pref.nickname });
}
