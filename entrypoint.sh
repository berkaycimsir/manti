#!/bin/sh
set -e

echo "========================================"
echo "  Manti - Database Management Tool"
echo "========================================"

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit migrate

echo "Migrations completed successfully!"
echo ""
echo "Starting Manti server..."
echo "========================================"

# Start the Next.js server
exec node server.js
