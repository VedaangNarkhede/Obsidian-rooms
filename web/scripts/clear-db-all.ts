import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Deleting absolutely everything from the database...");
  
  await prisma.shareLink.deleteMany({});
  await prisma.grant.deleteMany({});
  
  await prisma.noteAttachment.deleteMany({});
  await prisma.noteLink.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.note.deleteMany({});
  
  await prisma.vault.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("Database successfully cleaned! 100% fresh slate.");
}

main().finally(() => prisma.$disconnect());
