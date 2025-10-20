#!/bin/bash

# KudiPay ngrok startup script
# Replace YOUR_STATIC_DOMAIN with your actual ngrok domain

NGROK_DOMAIN="YOUR_STATIC_DOMAIN.ngrok-free.app"
PORT=3000

echo "🚀 Starting ngrok tunnel..."
echo "📍 Domain: https://$NGROK_DOMAIN"
echo "🔌 Port: $PORT"
echo ""
echo "⚠️  IMPORTANT: Set this URL in Africa's Talking dashboard:"
echo "   https://$NGROK_DOMAIN/api/ussd/callback"
echo ""

# Start ngrok with static domain
ngrok http --domain=$NGROK_DOMAIN $PORT

# Alternative: Run in background
# ngrok http --domain=$NGROK_DOMAIN $PORT > /dev/null &
# echo "✅ ngrok started in background (PID: $!)"
