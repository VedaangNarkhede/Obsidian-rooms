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
  console.log("Deleting ApiKey rows to allow schema update...");
  // Use raw SQL to bypass Prisma schema mismatches since we modified schema.prisma
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ApiKey" CASCADE;`);
  console.log("ApiKeys deleted.");
}

main().finally(() => prisma.$disconnect());
