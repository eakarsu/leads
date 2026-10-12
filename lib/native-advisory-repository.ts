import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import type { AdvisoryRepository, ProviderReceipt, SavedAdvisory } from './native-advisory-runtime'
type Row = { id: string; input: unknown; output: unknown; model: string | null; createdAt: Date }
const saved = (row: Row): SavedAdvisory => { const input = row.input as { prompt?: unknown }, output = row.output as { content?: unknown; providerReceipt?: ProviderReceipt }; return { id: row.id, prompt: typeof input?.prompt === 'string' ? input.prompt : '', content: typeof output?.content === 'string' ? output.content : '', model: row.model || '', createdAt: row.createdAt.toISOString(), canDelete: false, providerReceipt: output?.providerReceipt } }
export const advisoryRepository: AdvisoryRepository = {
  async list(actor) { return (await prisma.aIResult.findMany({ where: { userId: actor.id, feature: 'runtime_lead_advice' }, orderBy: { createdAt: 'desc' }, take: 50 })).map(saved) },
  async save(actor, input, signal) { return prisma.$transaction(async tx => { signal.throwIfAborted(); const row = await tx.aIResult.create({ data: { id: crypto.randomUUID(), feature: 'runtime_lead_advice', userId: actor.id, input: { prompt: input.prompt }, output: { content: input.content, provider: 'openrouter', providerReceipt: input.providerReceipt }, model: input.model, durationMs: input.durationMs } }); signal.throwIfAborted(); return saved(row) }) },
}
