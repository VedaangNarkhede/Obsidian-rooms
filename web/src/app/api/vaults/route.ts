import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const vaults = await prisma.vault.findMany({
            where: { userId: (session.user as any).id },
            include: {
                _count: {
                    select: { notes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ vaults });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await req.json();
        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Vault name is required" }, { status: 400 });
        }

        const existingVault = await prisma.vault.findUnique({
            where: {
                userId_name: {
                    userId: (session.user as any).id,
                    name: name.trim()
                }
            }
        });

        if (existingVault) {
            return NextResponse.json({ error: "You already have a vault with this name" }, { status: 400 });
        }

        const vault = await prisma.vault.create({
            data: {
                name: name.trim(),
                userId: (session.user as any).id
            }
        });

        return NextResponse.json({ vault });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
