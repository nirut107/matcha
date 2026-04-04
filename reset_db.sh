#!/bin/bash

set -e

echo "🛑 Cleaning up environment and wiping volumes..."
docker-compose down -v --remove-orphans

echo "🚀 Starting fresh database..."
docker-compose up postgres -d

echo "⏳ Waiting for Postgres to be ready..."
until docker exec matcha_postgres pg_isready -U matcha -d matcha_db; do
  echo "Postgres is initializing..."
  sleep 1
done


echo "👤 Seeding users table..."

# docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/seed_users.sql

# echo "🏷 Seeding tags..."
# docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/seed_tags.sql

echo "✅ Database reset and seeded successfully!"
