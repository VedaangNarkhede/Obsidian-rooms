import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing Note and NoteAttachment tables...");
  
  // NoteAttachment is automatically deleted due to Cascade if Note is deleted, 
  // but we can just use deleteMany to be safe and clean.
  const deletedAttachments = await prisma.noteAttachment.deleteMany({});
  console.log(`Deleted ${deletedAttachments.count} NoteAttachment relations.`);

  const deletedNotes = await prisma.note.deleteMany({});
  console.log(`Deleted ${deletedNotes.count} Notes.`);

  console.log("Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
