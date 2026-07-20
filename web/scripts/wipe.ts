import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Cleaning database...');
  await prisma.noteAttachment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.noteLink.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.grant.deleteMany({});
  await prisma.shareLink.deleteMany({});
  await prisma.vaultPreference.deleteMany({});
  await prisma.vault.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database successfully cleaned.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
