import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    const body = await req.json();
    if (typeof body.isPublic !== 'boolean') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        const vault = await prisma.vault.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!vault || vault.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.vault.update({
            where: { id },
            data: { isPublic: body.isPublic }
        });

        if (!body.isPublic) {
            // Remove all public views for this vault if it's made private
            await prisma.publicVaultView.deleteMany({
                where: { vaultId: id }
            });
        }

        return NextResponse.json({ success: true, isPublic: body.isPublic });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
