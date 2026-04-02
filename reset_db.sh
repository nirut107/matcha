#!/bin/bash

set -e

echo "🛑 Stopping containers..."
docker-compose down

echo "🗑 Removing volumes (THIS DELETES DB DATA)..."
docker-compose down -v

echo "🧹 Removing orphan containers..."
docker-compose down --remove-orphans

echo "🚀 Starting fresh database..."
docker compose up postgres -d

echo "⏳ Waiting for DB to be ready..."
sleep 5

echo "✅ Database reset complete!"