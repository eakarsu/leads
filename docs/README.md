# LeadGenFlow AI

A production-ready lead generation agency platform with comprehensive Gen AI features powered by OpenRouter, built with Next.js, PostgreSQL, Prisma, and Material UI.

## Overview

LeadGenFlow AI is a full-featured web application designed for lead generation agencies managing thousands of campaigns globally. The platform combines traditional CRM/campaign management with cutting-edge AI capabilities for campaign automation, lead qualification, enrichment, and reporting.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Material UI (Material Design 3)
- **Backend**: Next.js API Routes (Node.js + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control
- **AI Integration**: OpenRouter API (supports multiple LLM providers)

## Features

### Core Features
- Full CRUD operations for all entities (Users, Clients, Campaigns, Leads, Activities, Reports)
- Role-based authentication (Admin, Account Manager, Campaign Specialist, Client)
- Client company management
- Multi-channel campaign management (Email, LinkedIn, Cold Call, Paid Ads, Multi-Channel)
- Lead tracking with qualification scoring
- Activity timeline tracking
- Data enrichment
- Report snapshots with metrics
- Internal messaging system

### AI-Powered Features

All AI features are powered by OpenRouter and support multiple LLM providers:

1. **AI Campaign Setup Automation** - Generate comprehensive campaign briefs
2. **AI Lead Qualification** - Automatic scoring and fit analysis
3. **AI Data Enrichment** - Infer company data and insights
4. **AI Outreach Copy Generation** - Create personalized outreach templates
5. **AI Activity Summaries** - Summarize calls and emails automatically
6. **AI Client Reporting** - Generate executive summaries from metrics
7. **AI KPI Insights** - Analyze funnel metrics and identify opportunities

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (installed and running locally)
- OpenRouter API key (get one at https://openrouter.ai)

## Installation & Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd leadgenflow
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your actual credentials:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leadgenflow

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_MODEL=anthropic/claude-3-haiku

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
```

Generate a secure secret: `openssl rand -base64 32`

### 3. Set Up Database

```bash
# Run migrations
npx prisma migrate dev

# Seed with sample data
npm run db:seed
```

### 4. Start the Application

```bash
./start.sh
```

Or manually:

```bash
npm run dev
```

Access at `http://localhost:3000`

## Default Login Credentials

- Email: `admin@leadgenflow.com`
- Password: `password123`

## Database Commands

```bash
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Apply migrations
npm run db:seed           # Seed database
npm run db:studio         # Open Prisma Studio
```

## Development Scripts

```bash
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Production server
npm run lint         # Run linter
```

## Security Notes

- All AI endpoints require authentication
- API keys are server-side only
- Passwords hashed with bcrypt
- Role-based access control

## License

Proprietary - All rights reserved
