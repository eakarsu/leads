import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/lead-operations/api';
import { applyOptOut, describeOptOut } from '@/lib/lead-operations/opt-out';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    return NextResponse.json(await describeOptOut(prisma, token));
  } catch (error) { return apiError(error); }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    await applyOptOut(prisma, token);
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
