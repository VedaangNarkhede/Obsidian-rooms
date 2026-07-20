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
  console.log("Deleting all notes and attachments...");
  
  await prisma.noteAttachment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.note.deleteMany({});
  
  console.log("Database successfully cleaned!");
}

main().finally(() => prisma.$disconnect());
