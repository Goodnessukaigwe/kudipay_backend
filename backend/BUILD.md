# 🏗️ Build & Deployment Commands

## Quick Start

```bash
# Install dependencies
npm install

# Run build
npm run build

# Start production server
npm start
```

## Available Scripts

### Development

- `npm run dev` - Run with nodemon (auto-restart)
- `npm start` - Run production server
- `npm run prod` - Run with NODE_ENV=production

### Build & Deploy

- `npm run build` - Build for deployment (validates code)
- `npm run validate` - Validate package
- `npm run lint` - Check code quality
- `npm run lint:fix` - Auto-fix linting issues
- `./build.sh` - Comprehensive build script

### Database

- `npm run db:migrate` - Run main schema
- `npm run db:migrate:pin` - Add PIN security
- `npm run db:migrate:blockchain` - Add blockchain tracking
- `npm run db:migrate:fx` - Add FX conversions

### Testing

- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## For Hosting Platforms

Most hosting platforms need:

1. **Build Command**: `npm run build` or `npm install`
2. **Start Command**: `npm start`
3. **Port**: `3000` (or use `PORT` env variable)

### Platform-Specific Instructions

#### Railway

```bash
railway init
railway up
```

- Build: `npm run build`
- Start: `npm start`

#### Render

- Build: `npm install && npm run build`
- Start: `npm start`

#### Heroku

```bash
git push heroku main
```

Uses `Procfile` automatically

#### Vercel/Netlify (Serverless)

- Build: `npm run build`
- Output: `src/index.js`

## What the Build Does

1. ✅ Installs dependencies
2. 🔍 Runs linter (optional)
3. ✓ Validates JavaScript syntax
4. 📁 Sets up directories
5. ✅ Confirms build success

## Environment Setup

1. Copy `.env.production` to `.env`
2. Fill in all required values:
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://...
   # ... etc
   ```
3. Run migrations:
   ```bash
   npm run db:migrate
   npm run db:migrate:pin
   npm run db:migrate:blockchain
   npm run db:migrate:fx
   ```

## Troubleshooting

### "Build command not found"

Make sure you're in the `backend` directory:

```bash
cd backend
npm run build
```

### Port already in use

Change port in `.env`:

```bash
PORT=3001
```

### Database connection error

Verify `DATABASE_URL` in `.env`:

```bash
echo $DATABASE_URL
```

## Need More Help?

See [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.
