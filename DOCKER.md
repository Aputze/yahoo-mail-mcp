# Docker Deployment Guide

This guide explains how to deploy the Yahoo Mail MCP Server using Docker.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose (optional, for easier deployment)
- Yahoo OAuth2 credentials (Client ID, Client Secret)

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Create `.env` file** in the project root:
   ```env
   YAHOO_CLIENT_ID=your_client_id
   YAHOO_CLIENT_SECRET=your_client_secret
   YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback
   YAHOO_EMAIL=your_email@yahoo.com
   ```

2. **Build and run**:
   ```bash
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Option 2: Docker CLI

1. **Build the image**:
   ```bash
   docker build -t yahoo-mail-mcp:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name yahoo-mail-mcp \
     --restart unless-stopped \
     -e YAHOO_CLIENT_ID=your_client_id \
     -e YAHOO_CLIENT_SECRET=your_client_secret \
     -e YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback \
     -e YAHOO_EMAIL=your_email@yahoo.com \
     -v yahoo-mcp-tokens:/app/.yahoo-mail-mcp \
     -p 3000:3000 \
     yahoo-mail-mcp:latest
   ```

3. **View logs**:
   ```bash
   docker logs -f yahoo-mail-mcp
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `YAHOO_CLIENT_ID` | Your Yahoo OAuth2 Client ID | `dj0yJmk9...` |
| `YAHOO_CLIENT_SECRET` | Your Yahoo OAuth2 Client Secret | `a1b2c3d4...` |
| `YAHOO_EMAIL` | Your Yahoo email address | `user@yahoo.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `YAHOO_REDIRECT_URI` | `http://localhost:3000/oauth/callback` | OAuth redirect URI |
| `YAHOO_IMAP_HOST` | `imap.mail.yahoo.com` | IMAP server host |
| `YAHOO_IMAP_PORT` | `993` | IMAP server port |
| `YAHOO_CALDAV_URL` | `https://caldav.calendar.yahoo.com` | CalDAV server URL |
| `MCP_SERVER_NAME` | `yahoo-mail-mcp` | MCP server name |
| `OAUTH_PORT` | `3000` | Port for OAuth callbacks |

## Persistent Storage

OAuth tokens are stored in a Docker volume for persistence:

```bash
# View volumes
docker volume ls

# Inspect volume
docker volume inspect yahoo_mail_mcp_yahoo-mcp-tokens

# Backup tokens (if needed)
docker run --rm -v yahoo_mail_mcp_yahoo-mcp-tokens:/data -v $(pwd):/backup alpine tar czf /backup/tokens-backup.tar.gz -C /data .
```

## Development Mode

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will:
- Mount source code as a volume
- Use development dependencies
- Enable hot reload with `tsx watch`

## Building Custom Images

### Production Build

```bash
docker build -t yahoo-mail-mcp:v1.0.0 .
```

### Development Build

```bash
docker build -f Dockerfile.dev -t yahoo-mail-mcp:dev .
```

## Multi-stage Build

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Installs all dependencies and builds TypeScript
2. **Production stage**: Only includes production dependencies and built files

This results in a smaller final image (~150MB vs ~500MB).

## OAuth Flow in Docker

When running in Docker, you need to handle the OAuth callback:

### Option 1: Use Host Redirect

Set `YAHOO_REDIRECT_URI` to your host machine:
```env
YAHOO_REDIRECT_URI=http://your-host-ip:3000/oauth/callback
```

### Option 2: Port Forwarding

Map the container port to your host:
```yaml
ports:
  - "3000:3000"
```

Then use `http://localhost:3000/oauth/callback`

### Option 3: Use External OAuth Flow

1. Run OAuth flow on your local machine:
   ```bash
   npm run oauth-flow
   ```
2. Copy the tokens to the Docker volume:
   ```bash
   docker cp ~/.yahoo-mail-mcp/tokens.json yahoo-mail-mcp:/app/.yahoo-mail-mcp/
   ```

## Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check health status
docker ps
# Look for "healthy" status

# View health check logs
docker inspect --format='{{json .State.Health}}' yahoo-mail-mcp | jq
```

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   docker logs yahoo-mail-mcp
   ```

2. **Verify environment variables**:
   ```bash
   docker exec yahoo-mail-mcp env | grep YAHOO
   ```

3. **Check permissions**:
   ```bash
   docker exec yahoo-mail-mcp ls -la /app/.yahoo-mail-mcp
   ```

### OAuth Tokens Not Persisting

1. **Verify volume is mounted**:
   ```bash
   docker inspect yahoo-mail-mcp | grep -A 10 Mounts
   ```

2. **Check volume permissions**:
   ```bash
   docker exec yahoo-mail-mcp ls -la /app/.yahoo-mail-mcp
   ```

### Connection Issues

1. **Test network connectivity**:
   ```bash
   docker exec yahoo-mail-mcp ping -c 3 imap.mail.yahoo.com
   ```

2. **Check firewall rules** for ports 993 (IMAP), 587 (SMTP), 443 (CalDAV)

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use Docker secrets** for sensitive data in production:
   ```yaml
   secrets:
     yahoo_client_secret:
       file: ./secrets/client_secret.txt
   ```

3. **Run as non-root user** (already configured in Dockerfile)
4. **Use read-only filesystem** where possible:
   ```yaml
   read_only: true
   tmpfs:
     - /tmp
   ```

5. **Limit container resources**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Production Deployment

For production, consider:

1. **Use orchestration platform**:
   - Kubernetes
   - Docker Swarm
   - AWS ECS
   - Google Cloud Run

2. **Set up monitoring**:
   - Health check endpoints
   - Log aggregation (e.g., ELK stack)
   - Metrics collection (e.g., Prometheus)

3. **Use secrets management**:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Kubernetes Secrets

4. **Enable TLS** for OAuth callbacks

5. **Set resource limits** in docker-compose or Kubernetes manifests

## Example: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yahoo-mail-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: yahoo-mail-mcp
  template:
    metadata:
      labels:
        app: yahoo-mail-mcp
    spec:
      containers:
      - name: yahoo-mail-mcp
        image: yahoo-mail-mcp:latest
        env:
        - name: YAHOO_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: yahoo-secrets
              key: client-id
        - name: YAHOO_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: yahoo-secrets
              key: client-secret
        volumeMounts:
        - name: tokens
          mountPath: /app/.yahoo-mail-mcp
      volumes:
      - name: tokens
        persistentVolumeClaim:
          claimName: yahoo-mcp-tokens
```

## Support

For issues or questions:
- Check the main README.md
- Review logs: `docker logs yahoo-mail-mcp`
- Verify environment variables are set correctly

