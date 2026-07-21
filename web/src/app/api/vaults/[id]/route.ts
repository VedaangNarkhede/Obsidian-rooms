import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteAttachment } from '@/lib/cloudinary';

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

        // Find all attachments used by notes in this vault
        const notes = await prisma.note.findMany({
            where: { vaultId },
            include: { attachments: true }
        });
        
        const attachmentIds = new Set<string>();
        for (const n of notes) {
            for (const a of n.attachments) {
                attachmentIds.add(a.attachmentId);
            }
        }

        // Delete the vault. Thanks to onDelete: Cascade, this will automatically delete all Notes, 
        // NoteAttachments, and Grants associated with this vault.
        await prisma.vault.delete({
            where: { id: vaultId }
        });

        // Cleanup orphaned attachments
        for (const aId of attachmentIds) {
            const usageCount = await prisma.noteAttachment.count({
                where: { attachmentId: aId }
            });
            if (usageCount === 0) {
                const attachment = await prisma.attachment.findUnique({ where: { id: aId } });
                if (attachment) {
                    try {
                        await deleteAttachment(attachment.hash);
                        await prisma.attachment.delete({ where: { id: aId } });
                    } catch (e) {
                        console.error("Failed to delete attachment from Cloudinary", e);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, message: "Vault deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { vaultName } = await req.json();
        if (!vaultName || typeof vaultName !== 'string') {
            return NextResponse.json({ error: 'Invalid vault name' }, { status: 400 });
        }

        const { id: vaultId } = await params;
        
        const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
        if (!vault) {
            return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
        }
        
        if (vault.userId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Only the vault owner can rename it' }, { status: 403 });
        }

        const updatedVault = await prisma.vault.update({
            where: { id: vaultId },
            data: { name: vaultName.trim() }
        });

        return NextResponse.json({ success: true, vault: updatedVault });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

