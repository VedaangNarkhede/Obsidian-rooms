import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteAttachment } from '@/lib/cloudinary';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { folderName } = await request.json();
        if (!folderName || typeof folderName !== 'string') {
            return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
        }

        const { id: vaultId } = await params;
        
        // Verify access
        const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
        if (!vault) {
            return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
        }
        
        if (vault.userId !== session.user.id) {
            return NextResponse.json({ error: 'Only the vault owner can delete folders' }, { status: 403 });
        }

        const prefix = `${folderName}/`;
        const notesToDelete = await prisma.note.findMany({
            where: {
                vaultId,
                path: { startsWith: prefix }
            },
            select: { id: true, attachments: true }
        });

        const attachmentIds = new Set<string>();
        for (const n of notesToDelete) {
            for (const a of n.attachments) {
                attachmentIds.add(a.attachmentId);
            }
        }

        if (notesToDelete.length > 0) {
            const ids = notesToDelete.map(n => n.id);
            await prisma.note.deleteMany({
                where: { id: { in: ids } }
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
        }

        return NextResponse.json({ success: true, count: notesToDelete.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
