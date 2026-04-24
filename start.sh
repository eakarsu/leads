#!/usr/bin/env bash
set -e

echo "🚀 Starting LeadGenFlow AI..."
echo ""

# Function to kill process on port 3000
kill_port_3000() {
  echo "🔍 Checking for processes on port 3000..."

  # Find and kill processes using port 3000
  if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Found process(es) using port 3000. Cleaning up..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "✅ Port 3000 is now free"
  else
    echo "✅ Port 3000 is available"
  fi
  echo ""
}

# Clean up port 3000
kill_port_3000

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file. Please update it with your actual credentials before proceeding."
  echo ""
  echo "Required updates:"
  echo "  1. DATABASE_URL - Your PostgreSQL connection string"
  echo "  2. OPENROUTER_API_KEY - Your OpenRouter API key"
  echo "  3. NEXTAUTH_SECRET - Generate with: openssl rand -base64 32"
  echo ""
  exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
fi

# Check if Prisma client is generated
if [ ! -d node_modules/.prisma ]; then
  echo "🔧 Generating Prisma client..."
  npx prisma generate
  echo "✅ Prisma client generated"
  echo ""
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations completed"
echo ""

# Seed database (default: no)
echo "⏭️  Skipping database seed (run 'npm run db:seed' manually if needed)"
echo ""

echo "🎉 Setup complete! Starting development server..."
echo ""
echo "📝 Login credentials:"
echo "   Email: admin@leadgenflow.com"
echo "   Password: password123"
echo ""
echo "🌐 Opening at: http://localhost:3000"
echo ""

# Start the development server
npm run dev
