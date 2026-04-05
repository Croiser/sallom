#!/bin/bash
# Script to run SalaoProManager locally

echo "Setting environment variables..."

export DATABASE_URL="postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public"
export NODE_ENV="production"

echo "Starting SalaoProManager at http://localhost:3000"
echo ""

npm run dev
