#!/bin/bash

echo "🎮 Starting Doodle Tower Defence Local Deployment"
echo "================================================="

# Set environment variables
export JWT_SECRET="super-secret-jwt-key-for-local-development-minimum-32-chars"
export REFRESH_SECRET="super-secret-refresh-key-for-local-development-32-chars"

echo "✅ Environment variables set"

# Start database
echo "🗄️  Starting PostgreSQL database..."
docker-compose up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

# Check database
if docker-compose exec db pg_isready -U app -d doodletd; then
    echo "✅ Database is ready"
else
    echo "❌ Database failed to start"
    exit 1
fi

# Create tables manually
echo "📊 Creating database tables..."
docker-compose exec db psql -U app -d doodletd -c "
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  score integer NOT NULL,
  mode text NOT NULL,
  wave_reached integer NOT NULL,
  duration_ms integer NOT NULL,
  seed text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  client_version text NOT NULL
);

CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  blob jsonb NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  revoked boolean DEFAULT false NOT NULL
);
"

echo "✅ Database tables created"

# Start frontend
echo "🎨 Starting frontend development server..."
cd frontend
pnpm dev &
FRONTEND_PID=$!

echo "✅ Frontend started on http://localhost:3001/doodle-td"
echo ""
echo "🎮 Game is ready to play!"
echo "👉 Open your browser to: http://localhost:3001/doodle-td"
echo ""
echo "📝 Note: Backend API is not fully connected yet, but you can see the game interface"
echo "🛑 Press Ctrl+C to stop all services"

# Wait for user to stop
wait $FRONTEND_PID