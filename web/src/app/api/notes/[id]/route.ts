import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteAttachment } from '@/lib/cloudinary';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // 1. Fetch note and verify ownership (must be owner of the vault to delete)
    const note = await prisma.note.findUnique({
        where: { id },
        include: { vault: true, attachments: true }
    });

    if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.vault.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Only the vault owner can delete notes' }, { status: 403 });
    }

    // 2. Identify attachments that belong to this note
    const attachmentIds = note.attachments.map(na => na.attachmentId);

    // 3. Delete the note (Prisma Cascade will delete NoteLink and NoteAttachment automatically)
    await prisma.note.delete({
        where: { id }
    });

    // 4. Garbage Collection for Orphaned Attachments
    // Check if any of those attachments are no longer linked to ANY notes in the database
    for (const attachId of attachmentIds) {
        const attachRecord = await prisma.attachment.findUnique({
            where: { id: attachId },
            include: { _count: { select: { notes: true } } }
        });

        // If no notes are using this attachment anymore, delete the record.
        if (attachRecord && attachRecord._count.notes === 0) {
            await prisma.attachment.delete({
                where: { id: attachId }
            });
            // Permanently delete from Cloudinary
            try {
                await deleteAttachment(attachRecord.hash);
                console.log(`Cloudinary image ${attachRecord.hash} deleted successfully.`);
            } catch (err) {
                console.error(`Failed to delete Cloudinary image ${attachRecord.hash}:`, err);
            }
        }
    }

    return NextResponse.json({ success: true });
}
