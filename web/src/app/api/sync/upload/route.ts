import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptNote } from '@/lib/encryption';
import { uploadAttachment } from '@/lib/cloudinary';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const apiKey = formData.get('apiKey') as string;
    const vaultName = formData.get('vaultName') as string;

    if (!apiKey || !vaultName) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true }
    });
    if (!apiKeyRecord) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    const user = apiKeyRecord.user;

    const vault = await prisma.vault.upsert({
      where: { userId_name: { userId: user.id, name: vaultName } },
      update: {},
      create: { userId: user.id, name: vaultName }
    });

    // 1. Process Attachments
    const attachmentPaths = formData.getAll('attachmentPaths') as string[];
    const attachmentHashes = formData.getAll('attachmentHashes') as string[];
    const attachmentBlobs = formData.getAll('attachmentBlobs') as File[];

    const processedAttachmentIds: Record<string, string> = {}; // hash -> attachmentId

    for (let i = 0; i < attachmentHashes.length; i++) {
        const hash = attachmentHashes[i];
        let attachment = await prisma.attachment.findUnique({ where: { hash } });
        
        // Only upload to Cloudinary if it doesn't already exist in the DB (global deduplication!)
        if (!attachment && attachmentBlobs[i]) {
            const buffer = await attachmentBlobs[i].arrayBuffer();
            const url = await uploadAttachment(buffer, hash);
            attachment = await prisma.attachment.create({
                data: { hash, url }
            });
        }
        if (attachment) {
            processedAttachmentIds[hash] = attachment.id;
        }
    }

    // 2. Process Notes & Link Attachments
    const notePaths = formData.getAll('notePaths') as string[];
    const noteHashes = formData.getAll('noteHashes') as string[];
    const noteContents = formData.getAll('noteContents') as string[];
    
    // We expect the plugin to send a JSON string mapping notePath -> { [filename]: attachmentHash }
    const noteAttachmentMapStr = formData.get('noteAttachmentMap') as string;
    const noteAttachmentMap: Record<string, Record<string, string>> = noteAttachmentMapStr ? JSON.parse(noteAttachmentMapStr) : {};

    // We expect the plugin to send a JSON string mapping notePath -> string[] (targetPaths)
    const noteLinksStr = formData.get('noteLinks') as string;
    const noteLinks: Record<string, string[]> = noteLinksStr ? JSON.parse(noteLinksStr) : {};

    for (let i = 0; i < notePaths.length; i++) {
       const encryptedContent = encryptNote(noteContents[i]);
       
       const note = await prisma.note.upsert({
         where: { vaultId_path: { vaultId: vault.id, path: notePaths[i] } },
         update: { hash: noteHashes[i], contentCiphertext: encryptedContent },
         create: {
           vaultId: vault.id,
           path: notePaths[i],
           hash: noteHashes[i],
           contentCiphertext: encryptedContent
         }
       });

       // Link attachments
       const attachmentsUsedByNote = noteAttachmentMap[notePaths[i]] || {};
       for (const [filename, aHash] of Object.entries(attachmentsUsedByNote)) {
           let attachmentId = processedAttachmentIds[aHash];
           if (!attachmentId) {
               const existing = await prisma.attachment.findUnique({ where: { hash: aHash } });
               if (existing) attachmentId = existing.id;
           }
           if (attachmentId) {
               await prisma.noteAttachment.upsert({
                   where: { noteId_attachmentId: { noteId: note.id, attachmentId } },
                   update: { filename },
                   create: { noteId: note.id, attachmentId, filename }
               });
           }
       }

       // Save Note Topology (Graph edges)
       const outgoingLinks = noteLinks[notePaths[i]] || [];
       for (const targetPath of outgoingLinks) {
           await prisma.noteLink.upsert({
               where: { sourceNoteId_targetPath: { sourceNoteId: note.id, targetPath } },
               update: {},
               create: { sourceNoteId: note.id, targetPath }
           });
       }
    }

    return NextResponse.json({ success: true, uploadedNotes: notePaths.length, uploadedAttachments: attachmentHashes.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
