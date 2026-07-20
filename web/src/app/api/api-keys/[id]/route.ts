import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: apiKeyId } = await params;

        const apiKey = await prisma.apiKey.findUnique({
            where: { id: apiKeyId }
        });

        if (!apiKey) {
            return NextResponse.json({ error: "API Key not found" }, { status: 404 });
        }

        if (apiKey.userId !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // The user mentioned requiring a 'delete' confirmation, but that is a UI concern.
        // We handle the actual deletion securely here on the backend.
        await prisma.apiKey.delete({
            where: { id: apiKeyId }
        });

        return NextResponse.json({ success: true, message: "API Key deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
