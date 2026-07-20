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
        const { id: vaultId } = await params;

        // Ensure the vault exists and belongs to the user
        const vault = await prisma.vault.findUnique({
            where: { id: vaultId }
        });

        if (!vault) {
            return NextResponse.json({ error: "Vault not found" }, { status: 404 });
        }

        if (vault.userId !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete the vault. Thanks to onDelete: Cascade, this will automatically delete all Notes, 
        // NoteAttachments, and Grants associated with this vault.
        // It will NOT delete Attachments (Cloudinary files) since they might be used by other vaults.
        await prisma.vault.delete({
            where: { id: vaultId }
        });

        return NextResponse.json({ success: true, message: "Vault deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
