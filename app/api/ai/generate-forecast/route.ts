import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRevenueForecast } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch opportunities for forecasting
    const opportunities = await prisma.opportunity.findMany({
      where: {
        stage: {
          notIn: ['CLOSED_LOST'],
        },
      },
      include: {
        client: true,
        owner: true,
      },
    });

    // Generate AI forecast
    const forecast = await generateRevenueForecast(opportunities);

    // Store forecasts in database
    const now = new Date();
    const createdForecasts = [];

    // Store monthly forecasts
    for (const monthlyForecast of forecast.monthly) {
      const created = await prisma.revenueForecast.create({
        data: {
          period: monthlyForecast.month,
          forecastType: 'MONTHLY',
          predictedAmount: monthlyForecast.predicted,
          confidence: monthlyForecast.confidence,
          breakdown: {},
          generatedBy: session.user.id,
        },
      });
      createdForecasts.push(created);
    }

    // Store quarterly forecasts
    for (const quarterlyForecast of forecast.quarterly) {
      const created = await prisma.revenueForecast.create({
        data: {
          period: quarterlyForecast.quarter,
          forecastType: 'QUARTERLY',
          predictedAmount: quarterlyForecast.predicted,
          confidence: quarterlyForecast.confidence,
          breakdown: {},
          generatedBy: session.user.id,
        },
      });
      createdForecasts.push(created);
    }

    return NextResponse.json({
      forecasts: createdForecasts,
      insights: forecast.insights,
    });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
