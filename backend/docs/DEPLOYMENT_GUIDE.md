# 🚀 KudiPay Backend Deployment Guide

## Build Commands Available

Your backend now has the following build and deployment commands:

### Development
```bash
npm run dev          # Run with nodemon (auto-restart on changes)
npm start            # Run in production mode
npm run prod         # Run with NODE_ENV=production
```

### Build & Deployment
```bash
npm run build        # Build command for hosting platforms
./build.sh           # Comprehensive build script
npm run validate     # Validate the build
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues automatically
```

### Database
```bash
npm run db:migrate            # Run main schema
npm run db:migrate:pin        # Add PIN security
npm run db:migrate:blockchain # Add blockchain tracking
npm run db:migrate:fx         # Add FX conversions
```

---

## Hosting Platform Deployment

### 1. **Railway** (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="your-postgres-url"
# ... add all other env variables

# Deploy
railway up
```

**Railway Configuration:**
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: 3000 (auto-detected)

### 2. **Render**

**render.yaml** (create in backend folder):
```yaml
services:
  - type: web
    name: kudipay-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
```

Connect your GitHub repo and Render will auto-deploy!

### 3. **Heroku**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
cd backend
heroku create kudipay-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set AT_USERNAME=your-username
# ... add all other env variables

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

### 4. **DigitalOcean App Platform**

**app.yaml**:
```yaml
name: kudipay-backend
services:
- name: api
  github:
    repo: Goodnessukaigwe/kudipay_backend
    branch: main
    deploy_on_push: true
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  envs:
  - key: NODE_ENV
    value: production
  http_port: 3000
  
databases:
- name: kudipay-db
  engine: PG
  production: true
```

### 5. **AWS EC2 / VPS**

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/Goodnessukaigwe/kudipay_backend.git
cd kudipay_backend/backend

# Install dependencies
npm ci --production

# Set up environment
cp .env.production .env
nano .env  # Edit with your values

# Run build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start src/index.js --name kudipay-backend

# Set up auto-restart on reboot
pm2 startup
pm2 save

# Set up Nginx as reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/kudipay
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Pre-Deployment Checklist

- [ ] Set all environment variables in `.env`
- [ ] Update `DATABASE_URL` to production database
- [ ] Set `NODE_ENV=production`
- [ ] Add blockchain RPC URL and keys
- [ ] Configure Africa's Talking credentials
- [ ] Add Flutterwave API keys
- [ ] Set strong `JWT_SECRET`
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure CORS for your frontend domain
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy for database

---

## Environment Variables Required

```bash
# Copy from .env.production and fill in:
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
BLOCKCHAIN_RPC_URL=https://mainnet.base.org
AT_USERNAME=sandbox
AT_API_KEY=your-key
FLUTTERWAVE_SECRET_KEY=your-key
JWT_SECRET=your-secret
# ... see .env.production for complete list
```

---

## Testing Your Deployment

```bash
# Health check
curl https://your-api-url.com/health

# Test API endpoint
curl -X POST https://your-api-url.com/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348012345678", "pin": "1234"}'
```

---

## Continuous Deployment

### GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run build
        run: cd backend && npm run build
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Monitoring & Logs

```bash
# View logs on Railway
railway logs

# View logs on Heroku
heroku logs --tail

# View logs with PM2
pm2 logs kudipay-backend

# View application logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

---

## Troubleshooting

### Build fails
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails
```bash
# Test database connection
psql $DATABASE_URL

# Run migrations
npm run db:migrate
```

### Port already in use
```bash
# Change PORT in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## Support

For deployment issues, check:
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Heroku Docs](https://devcenter.heroku.com/)

Your backend is now ready for deployment! 🎉
