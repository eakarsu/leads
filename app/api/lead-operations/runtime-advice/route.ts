import { requireOperationsActor } from '@/lib/lead-operations/auth'
import { createAdvisoryHandlers } from '@/lib/native-advisory-runtime'
import { advisoryRepository } from '@/lib/native-advisory-repository'
const handlers = createAdvisoryHandlers({
  async authenticate() { const actor = await requireOperationsActor(); return { id: actor.id, role: actor.role, scopeId: actor.clientId || undefined } },
  repository: advisoryRepository, maxPrompt: 8000, requireReceipt: true, receiptHeaderFallback: true,
  systemPrompt: 'You are a governed lead-operations reviewer. Return concise risks, evidence gaps, next actions, uncertainty, and decisions requiring human approval.',
  reply: item => ({ id: item.id, content: item.content, provider: 'openrouter', model: item.model, providerReceipt: item.providerReceipt }),
})
export const POST = handlers.POST
export const GET = handlers.GET
