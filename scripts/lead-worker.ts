import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { processOneOutreach, processOneSyncOperation } from '@/lib/lead-operations/workers';

const once = process.argv.includes('--once');
const workerId = process.env.WORKER_ID || `lead-worker:${randomUUID()}`;
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });

async function iteration() {
  const [outreach, sync] = await Promise.all([
    processOneOutreach(prisma, `${workerId}:outreach`),
    processOneSyncOperation(prisma, `${workerId}:sync`),
  ]);
  return outreach !== 'idle' || sync !== 'idle';
}

async function main() {
  do {
    const worked = await iteration();
    if (once) break;
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (!stopped);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[lead-worker] fatal error', error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
