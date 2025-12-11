# Deploy Backend to Fly.io (Advanced Option)

Fly.io is great for production, requires CLI setup. More control, but slightly more complex.

## Step 1: Install Fly CLI (5 minutes)

### Linux/Mac:
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows:
Download from: https://fly.io/docs/hands-on/install-flyctl/

## Step 2: Login to Fly.io (1 minute)

```bash
fly auth login
```

This opens browser for authentication.

## Step 3: Create Fly.io App (2 minutes)

In your project root (`/home/gk-krishnan/Desktop/TOOL/`):

```bash
cd backend
fly launch
```

Follow prompts:
- **App name**: `intelligent-redundancy-scanner` (or auto-generated)
- **Region**: Choose closest (e.g., `iad` for US East)
- **Postgres?**: No (we don't need database)
- **Redis?**: No

## Step 4: Configure fly.toml (5 minutes)

Fly.io creates `fly.toml`. Update it:

```toml
app = "your-app-name"
primary_region = "iad"

[build]

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[http_service.checks]]
  grace_period = "1s"
  interval = "15s"
  method = "GET"
  timeout = "2s"
  path = "/health"
```

## Step 5: Create Dockerfile (if needed)

Fly.io can auto-detect, but if needed, create `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

## Step 6: Deploy (3 minutes)

```bash
fly deploy
```

Watch the deployment. First deploy takes longer (downloads base image).

## Step 7: Get Your Backend URL (1 minute)

```bash
fly status
```

Or check in Fly.io dashboard:
- URL format: `https://your-app-name.fly.dev`
- **Copy this URL** - this is your `BACKEND_URL`

## Step 8: Test Your Backend (2 minutes)

1. Open: `https://your-app-name.fly.dev`
2. Should see: `{"message": "Intelligent Redundancy Scanner API", ...}`
3. Test: `https://your-app-name.fly.dev/health`

## Step 9: View Logs (Optional)

```bash
fly logs
```

## Troubleshooting

### Deploy Fails
- Check `fly logs` for errors
- Ensure `requirements.txt` is correct
- Verify Dockerfile if using custom

### App Not Starting
- Check `fly status`
- Review `fly logs`
- Verify port configuration

## Fly.io Free Tier

- **3 shared-cpu VMs** free
- **3GB persistent volumes** free
- **160GB outbound data transfer** free
- Good for production use

## Next Step

Copy your backend URL:
- `BACKEND_URL = 'https://your-app-name.fly.dev'`

Use this in Apps Script setup!

