# EC2 Auto-Deploy Guide (GitHub Actions + Docker Compose)

This document sets up automatic deployment of the root stack to EC2 on every push to `main`.

## 1) One-time local repo setup

Run these commands in the project root:

```powershell
git init
git add .
git commit -m "Initial commit: technieum ai labs"
git remote add origin https://github.com/thompson005/Tehchnieum-AI-Lab.git
git branch -M main
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/thompson005/Tehchnieum-AI-Lab.git
git push -u origin main
```

## 2) EC2 server bootstrap

Use Ubuntu 22.04 or later.

### Install Docker + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### Prepare deploy directory and environment file

```bash
sudo mkdir -p /opt/technieum-ai-lab
sudo chown -R $USER:$USER /opt/technieum-ai-lab
```

Create `/opt/technieum-ai-lab/.env` using values from `.env.example`.

Required minimum:

```env
PUBLIC_BASE_URL=http://YOUR_EC2_PUBLIC_IP
OPENAI_API_KEY=YOUR_REAL_KEY
OPENAI_MODEL=gpt-4o-mini
LLM_MODEL=gpt-4o-mini
```

## 3) GitHub repository secrets

In GitHub -> Settings -> Secrets and variables -> Actions, create:

- `EC2_HOST`: EC2 public IP or DNS
- `EC2_USER`: SSH username (example: `ubuntu`)
- `EC2_SSH_KEY`: private SSH key content (PEM format)
- `EC2_SSH_PORT`: optional, default `22`
- `EC2_APP_DIR`: optional, default `/opt/technieum-ai-lab`

## 4) Workflow behavior

File: `.github/workflows/deploy-ec2.yml`

On every push to `main`, workflow will:

1. SSH to EC2
2. Clone/update repo in app directory
3. Run deploy script (`deploy/ec2/deploy.sh`)
4. Run health checks (`deploy/ec2/healthcheck.sh`)
5. Publish live EC2 service URLs in the GitHub Actions run summary

If checks fail, workflow fails and does not report successful deployment.

## 5) Manual rollback

Use GitHub Actions -> `Deploy To EC2` -> `Run workflow` and pass `rollback_sha`.

The workflow will deploy that exact commit SHA.

## 6) Networking and security checklist

- Restrict SSH ingress to trusted IPs only.
- Open only required app ports (5555, 5000, 3000, 8000, 8080, 8083, 3001, 3100, 8090, 9000, 3200, 8100, 8110-8118) or place behind reverse proxy.
- Do not commit real `.env` values.
- Rotate any API keys previously exposed.

## 7) Verify auto-deploy end-to-end

1. Make a small visible code change.
2. Commit and push to `main`.
3. Confirm workflow success in GitHub Actions.
4. Refresh EC2-hosted URL and verify change is live.
