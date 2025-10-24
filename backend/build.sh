#!/bin/bash

# KudiPay Backend Build Script
# This script prepares the backend for deployment

set -e  # Exit on error

echo "🚀 Starting KudiPay Backend Build Process..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# 2. Run linter (optional, won't fail build)
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linter warnings found (non-critical)"

# 3. Validate Node.js syntax
echo "✅ Validating JavaScript files..."
find src -name "*.js" -type f -exec node --check {} \;

# 4. Check if required files exist
echo "📋 Checking required files..."
required_files=(
    "src/index.js"
    "config/db.js"
    "schema.sql"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found!"
        exit 1
    fi
done

# 5. Create logs directory if it doesn't exist
echo "📁 Setting up directories..."
mkdir -p logs

# 6. Run tests (if you want to add this later)
# echo "🧪 Running tests..."
# npm test

echo "✅ Build completed successfully!"
echo "📝 Next steps:"
echo "   1. Set up your .env file with production values"
echo "   2. Run database migrations: npm run db:migrate"
echo "   3. Start the server: npm start"
