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
  const notes = await prisma.note.findMany({
    include: { attachments: { include: { attachment: true } } }
  });
  console.dir(notes, { depth: null });
}

main().finally(() => prisma.$disconnect());
