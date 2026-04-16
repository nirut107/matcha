#!/bin/bash
set -e

CONTAINER=matcha_postgres_dev

echo "⏳ Waiting for PostgreSQL..."

until docker exec $CONTAINER pg_isready -U matcha > /dev/null 2>&1; do
  sleep 1
done

# optional: give postgres extra time
sleep 3

echo "🧹 Resetting database..."

# Drop & recreate schema (clean reset)
docker exec -i $CONTAINER psql -U matcha -d matcha_db <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
EOF

echo "🏗️ Creating tables..."
docker exec -i $CONTAINER psql -U matcha -d matcha_db < database/init.sql

echo "🌱 Seeding data..."
docker exec -i $CONTAINER psql -U matcha -d matcha_db < database/seed_profile_new.sql

# optional
# docker exec -i $CONTAINER psql -U matcha -d matcha_db < database/seed_tags.sql

echo "✅ DEV database ready!"