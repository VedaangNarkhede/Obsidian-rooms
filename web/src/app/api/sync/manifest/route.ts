import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { apiKey, vaultName, notes, attachments } = await req.json();

    if (!apiKey || !vaultName) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true }
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const user = apiKeyRecord.user;

    let vault = await prisma.vault.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: vaultName,
        }
      }
    });

    // Auto-create vault for ease of testing during Phase 3
    if (!vault) {
      vault = await prisma.vault.create({
        data: {
          name: vaultName,
          userId: user.id,
        }
      });
    }

    const neededNotes = [];
    for (const n of notes || []) {
      const existing = await prisma.note.findUnique({
        where: { vaultId_path: { vaultId: vault.id, path: n.path } }
      });
      if (!existing || existing.hash !== n.hash) {
        neededNotes.push(n.path);
      }
    }

    const neededAttachments = [];
    for (const a of attachments || []) {
      const existing = await prisma.attachment.findUnique({
        where: { hash: a.hash }
      });
      if (!existing) {
        neededAttachments.push(a.hash);
      }
    }

    return NextResponse.json({
      vaultId: vault.id,
      neededNotes,
      neededAttachments
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
