# LeadGenFlow AI - Quick Start Guide

## ⚡ Fastest Way to Get Started

### Prerequisites
- PostgreSQL installed and running
- Node.js 18+ installed
- OpenRouter API key (get from https://openrouter.ai)

### Setup (One-Time)

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add:
# - DATABASE_URL (your PostgreSQL connection)
# - OPENROUTER_API_KEY (from OpenRouter)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

3. **Setup database:**
```bash
npx prisma migrate dev
npm run db:seed
```

### Running the App

**Option 1: Use the start script (Recommended)**
```bash
./start.sh
```

This will:
- ✅ Kill any processes on port 3000
- ✅ Check environment setup
- ✅ Run migrations
- ✅ Optionally seed the database
- ✅ Start the dev server

**Option 2: Manual start**
```bash
npm run dev
```

### Access the App

Open: **http://localhost:3000**

Login:
- Email: `admin@leadgenflow.com`
- Password: `password123`

---

## 🎯 Features to Try

1. **Dashboard** → Generate AI Insights
2. **Campaigns** → AI Campaign Brief
3. **Leads** → Select a lead → AI Qualify / AI Enrich
4. **Clients** → View and create clients

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npx prisma migrate dev   # Create migration

# Cleanup
lsof -ti:3000 | xargs kill -9  # Kill port 3000
```

---

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
lsof -ti:3000 | xargs kill -9
```
Or just run `./start.sh` - it cleans up automatically!

**Database issues?**
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npm run db:seed           # Re-seed
```

**Environment variables not loading?**
Make sure `.env` exists and has correct values.

---

## 📚 Full Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions
- [COMPLETE.md](./COMPLETE.md) - Project overview
- [README.md](./README.md) - General information

---

**That's it! You're ready to use LeadGenFlow AI.** 🚀
