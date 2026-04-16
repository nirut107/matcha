#!/bin/bash
set -e

echo "⏳ Waiting for Readiness..."
until docker exec matcha_postgres pg_isready -U matcha; do
  sleep 1
done
sleep 10
echo "🏗️  Creating Schema (Tables)..."
docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/init.sql

# echo "🌱 Loading Seed Data..."
docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/seed_profile_new.sql
# docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/seed_tags.sql

# echo "✅ Database is ready with fake users!"
