#!/bin/bash

# Script to apply database migrations

echo "Applying Prisma database migrations..."

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

echo "Migrations applied successfully!" 