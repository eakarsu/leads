import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workOrderId } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: 'workOrderId is required' }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        workType: true,
        territory: { select: { name: true } },
        account: { select: { name: true } },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Get available resources
    const resources = await prisma.serviceResource.findMany({
      where: {
        isActive: true,
        ...(workOrder.territoryId ? { territoryId: workOrder.territoryId } : {}),
      },
      include: {
        skills: { include: { skill: true } },
        _count: { select: { appointments: true } },
      },
    });

    const prompt = `Recommend the best technician to dispatch for this work order:

WORK ORDER: ${workOrder.workOrderNumber}
- Subject: ${workOrder.subject}
- Priority: ${workOrder.priority}
- Type: ${workOrder.workType?.name || 'General'}
- Duration: ${workOrder.workType?.estimatedDurationMinutes || 60} minutes
- Location: ${workOrder.city || 'N/A'}, ${workOrder.state || 'N/A'}
- Account: ${workOrder.account?.name || 'N/A'}
- Required Skill: ${workOrder.workType?.skillRequirement || 'None'}

AVAILABLE RESOURCES:
${resources.map(r => `- ${r.name}: Skills=[${r.skills.map(s => `${s.skill.name}(${s.skillLevel})`).join(', ')}], Current Appointments=${r._count.appointments}, Efficiency=${r.efficiencyRating || 'N/A'}`).join('\n')}

Respond with ONLY a JSON object:
{
  "recommendedResource": "Resource Name",
  "confidence": 0.9,
  "reasoning": "explanation",
  "alternativeResources": [{"name": "Alt Name", "reason": "backup option"}],
  "estimatedArrival": "30 minutes",
  "tips": ["tip for the technician"]
}`;

    const response = await callOpenRouter(
      prompt,
      'You are a field service dispatch advisor AI. Recommend the best technician based on skills, availability, and proximity. Always respond with valid JSON only.'
    );

    let parsed;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { recommendedResource: null, confidence: 0, reasoning: response, alternativeResources: [], tips: [] };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error getting dispatch recommendation:', error);
    return NextResponse.json({ error: 'Failed to get dispatch recommendation' }, { status: 500 });
  }
}
