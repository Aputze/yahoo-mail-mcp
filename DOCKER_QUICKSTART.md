# Docker Quick Start

## Prerequisites

- Docker installed and running
- Your Yahoo OAuth2 credentials

## 1. Prepare Environment

Copy the example environment file:
```bash
cp .docker.env.example .env
```

Edit `.env` and add your credentials:
```env
YAHOO_CLIENT_ID=your_client_id
YAHOO_CLIENT_SECRET=your_client_secret
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback
```

## 2. Build and Run

### Option A: Docker Compose (Easiest)

```bash
# Build and start in one command
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option B: Docker CLI

```bash
# Build image
docker build -t yahoo-mail-mcp:latest .

# Run container
docker run -d \
  --name yahoo-mail-mcp \
  --env-file .env \
  -p 3000:3000 \
  -v yahoo-mcp-tokens:/app/.yahoo-mail-mcp \
  yahoo-mail-mcp:latest

# View logs
docker logs -f yahoo-mail-mcp

# Stop
docker stop yahoo-mail-mcp
docker rm yahoo-mail-mcp
```

## 3. Complete OAuth Flow

After starting the container, you need to complete the OAuth flow:

### Option 1: From Host Machine

1. Get authorization URL:
   ```bash
   npm run oauth-flow
   ```

2. Complete OAuth in browser
3. Copy tokens to container:
   ```bash
   docker cp ~/.yahoo-mail-mcp/tokens.json yahoo-mail-mcp:/app/.yahoo-mail-mcp/
   docker restart yahoo-mail-mcp
   ```

### Option 2: Inside Container

1. Enter the container:
   ```bash
   docker exec -it yahoo-mail-mcp sh
   ```

2. Run OAuth flow (if Node.js tools are available)

3. Or manually create tokens.json with your access/refresh tokens

## 4. Verify

Check container status:
```bash
docker ps
```

View logs for errors:
```bash
docker logs yahoo-mail-mcp
```

## Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Remove everything (including volumes)
docker-compose down -v
```

## Development Mode

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Troubleshooting

### Container exits immediately
- Check logs: `docker logs yahoo-mail-mcp`
- Verify environment variables are set
- Check if credentials are valid

### OAuth tokens not working
- Verify tokens.json exists in volume
- Check file permissions: `docker exec yahoo-mail-mcp ls -la /app/.yahoo-mail-mcp`
- Re-run OAuth flow if tokens expired

### Port conflicts
- Change port in `.env`: `OAUTH_PORT=3001`
- Update docker-compose.yml ports section

For more details, see [DOCKER.md](DOCKER.md)

