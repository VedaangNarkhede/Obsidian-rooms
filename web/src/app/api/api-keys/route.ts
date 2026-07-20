import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ apiKeys });
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
            return NextResponse.json({ error: "API key name is required" }, { status: 400 });
        }

        const rawKey = crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await prisma.apiKey.create({
            data: {
                name: name.trim(),
                keyHash,
                userId: (session.user as any).id
            }
        });

        // Return the rawKey just this ONE time so the user can copy it!
        return NextResponse.json({ apiKey: { ...apiKey, rawKey } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
