# Runbook

Operational guide for standing up the immigration law firm CRM from a clean AWS account. Assumes Terraform, the AWS CLI, and Git are installed locally, and that an AWS Key Pair named in `terraform.tfvars` exists in `us-east-1`.

Every step assumes the working directory is the repository root unless otherwise stated.

## Prerequisites

A `terraform.tfvars` file at the repository root with the operator IP (`/32` CIDR) and the AWS Key Pair name. Copy from `terraform.tfvars.example` if starting fresh.

The local SSH config at `~/.ssh/config` should have three host blocks named `bastion`, `app-server`, and `db-server`, with `ProxyJump bastion` set on the two private hosts. The `HostName` values need updating after every apply; the IPs change each time.

## Stand up the infrastructure

```
terraform init
terraform apply
```

The apply takes roughly 4 to 6 minutes. NAT Gateway provisioning is the slowest piece.

When apply finishes, read the IPs from Terraform output:

```
terraform output bastion_public_ip
terraform output app_server_private_ip
terraform output db_server_private_ip
```

Update the three `HostName` values in `~/.ssh/config` to match.

## Wait for hardening to finish

User_data scripts run on first boot and take several minutes per instance. Wait for the completion markers before doing anything else, because the connectivity wait loop plus apt upgrade can take a while.

```
ssh -q bastion    'ls /var/log/bastion-extras.complete 2>/dev/null && echo bastion ready || echo bastion still running'
ssh -q app-server 'ls /var/log/app-extras.complete 2>/dev/null && echo app ready || echo app still running'
ssh -q db-server  'ls /var/log/db-extras.complete 2>/dev/null && echo db ready || echo db still running'
```

Repeat every minute or so until all three report ready. If a server is taking longer than 8 minutes, check `/var/log/user-data.log` on that host for errors.

Optionally verify hardening properly with the audit script:

```
scp -q scripts/audit.sh bastion:/tmp/    && ssh -q bastion    'sudo bash /tmp/audit.sh'
scp -q scripts/audit.sh app-server:/tmp/ && ssh -q app-server 'sudo bash /tmp/audit.sh'
scp -q scripts/audit.sh db-server:/tmp/  && ssh -q db-server  'sudo bash /tmp/audit.sh'
```

Each should end with `=== N passed, 0 failed ===`.

## Install MongoDB on the DB Server

The MongoDB admin password is fresh on every apply (Secrets Manager recreates it), so the install script must run after every rebuild.

```
scp -q scripts/install-mongo.sh db-server:/tmp/
ssh -q db-server 'sudo bash /tmp/install-mongo.sh'
```

The script takes 3 to 5 minutes. It adds the MongoDB vendor repo, installs MongoDB 7, configures `mongod.conf`, bootstraps the admin user from Secrets Manager, and enables authentication. Watch the output for the verification line at the end that lists the databases. If you see that, the install worked.

## Seed the database

Fetch the admin password from Secrets Manager (via the DB Server's IAM role, which is the only thing that can read it), then run the seed script.

```
ADMIN_PASS=$(ssh -q db-server 'aws secretsmanager get-secret-value --secret-id lawfirm-crm/mongo-admin --region us-east-1 --query SecretString --output text' | jq -r .password)

scp -q scripts/seed-mongo.js db-server:/tmp/
ssh -q db-server "mongosh -u admin -p '$ADMIN_PASS' --authenticationDatabase admin /tmp/seed-mongo.js"
```

Expected output: lines reporting how many of each collection was inserted, ending with a summary block. Volumes are 7 staff, 50 clients, ~150 cases, ~500 documents, ~300 notes, 80 tasks.

The seed script is idempotent: it drops and recreates the Tier 1 collections each run, so it is safe to re-run.

## Verify the App Server can reach MongoDB

```
DB_IP=$(terraform output -raw db_server_private_ip)
ssh -q app-server "nc -zv $DB_IP 27017"
```

Expected: `Connection to <ip> 27017 port [tcp/*] succeeded!`. If this times out, the Security Group, UFW rule, or Mongo bind address is misconfigured.

## Deploy the API on the App Server

Copy the API source and start script up. The project notes call out that the App Server source is not auto-synced from the repo, so after any change to `app/src` the source has to be copied up explicitly.

```
ssh -q app-server 'sudo mkdir -p /opt/lawfirm-crm && sudo chown ubuntu:ubuntu /opt/lawfirm-crm'

scp -qr app/* app-server:/opt/lawfirm-crm/
scp -q scripts/start.sh app-server:/opt/lawfirm-crm/
```

Confirm `nginx.conf` arrived as a file, not a directory. The compose file bind-mounts `app/nginx/nginx.conf` into the Nginx container. If that path is missing on the host when compose runs, Docker creates an empty directory there and the container fails to start. The config must sit at `app/nginx/nginx.conf` in the repo, not at `app/nginx.conf`.

```
ssh -q app-server 'file /opt/lawfirm-crm/nginx/nginx.conf'
```

Expected: `ASCII text` or similar. If it reports `directory`, remove it with `sudo rmdir`, fix the repo path, and re-copy.

Run the start script on the App Server. It expects `MONGO_HOST` in the environment so it can write the `MONGO_URI` into the `.env` file, fetching the password from Secrets Manager via the App Server's IAM role.

```
ssh -q app-server "cd /opt/lawfirm-crm && sudo MONGO_HOST=$(terraform output -raw db_server_private_ip) bash start.sh"
```

The start script writes `.env` as root, so fix its permissions afterward:

```
ssh -q app-server 'sudo chmod 644 /opt/lawfirm-crm/.env'
```

Build and start the containers:

```
ssh -q app-server 'cd /opt/lawfirm-crm && sudo docker compose up -d --build'
```

The first build takes a few minutes (npm install, TypeScript compile). Subsequent builds are faster.

Verify the containers are up:

```
ssh -q app-server 'cd /opt/lawfirm-crm && sudo docker compose ps'
```

Both containers should show `Up`.

## Verify the API works

From the App Server:

```
ssh -q app-server 'curl -s http://localhost/health'
```

Expected: a small JSON response with a status. If you see it, Nginx is serving and proxying correctly.

Test a real authenticated route by logging in:

```
ssh -q app-server "curl -s -X POST http://localhost/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"mrodriguez@lawfirm.com\",\"password\":\"Password1!Maria\"}'"
```

Expected: a JSON response with a JWT token. If you get one, the full stack is working.

## Run the frontend locally

The frontend runs in dev mode on the Mac. The browser loads the app from Vite on port 5173. API calls use a relative `/api` path, which Vite's dev proxy (see `vite.config.ts`) forwards to `localhost:3001`. An SSH tunnel maps local 3001 to the App Server's Nginx on port 80, so the full path is browser to Vite to tunnel to Nginx to the API.

Port 3001 is the API tunnel and is not meant to be opened in a browser. Port 5173 is the app. Opening `localhost:3001` directly returns "Cannot GET /" because that hits the API, which has no homepage route. Note that `/health` is not proxied by Vite, so it is only reachable by curling the tunnel directly at `127.0.0.1:3001/health`, not from the browser.

In one terminal, kill any stale tunnel process holding the port, then open a fresh tunnel (this needs to stay running):

```
lsof -ti :3001 | xargs kill -9 2>/dev/null
ssh -q -N -L 127.0.0.1:3001:localhost:80 app-server
```

In another terminal, install dependencies and start the dev server:

```
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. Log in with `mrodriguez@lawfirm.com` / `Password1!Maria` (or any other seeded staff member with the pattern `Password1!<FirstName>`).

## Tear down

```
terraform destroy
```

Confirm with `yes`. The destroy takes about a minute.

This wipes everything including the MongoDB data and the Secrets Manager secret. On the next apply, a new password is generated and the install and seed scripts must run again from scratch. The application code in the repo is untouched.

## Common failures and fixes

If `terraform apply` returns `InvalidParameterValue` complaining about non-ASCII characters, check Security Group description strings for em-dashes or smart quotes.

If `terraform init` complains about an inconsistent dependency lock file, run `terraform init -upgrade` to refresh provider versions.

If user_data on a private instance hangs at the connectivity wait loop, the NAT Gateway may not be ready yet. Wait another minute and recheck.

If the audit script reports `tier: unknown`, the hardening script halted before writing its tier completion marker. Check `/var/log/user-data.log` on that host for the actual error.

If `install-mongo.sh` fails at the admin user bootstrap step, check that the AWS CLI is installed on the DB Server (`aws --version`) and that the IAM instance profile is attached (`aws sts get-caller-identity` should return an assumed-role ARN).

If `install-mongo.sh` aborts at the create-admin step with "User 'admin@admin' not found" on an otherwise clean apply, the admin bootstrap tried to drop a user that does not exist yet. The drop runs before the create for idempotency on re-runs, but on a fresh data dir there is nothing to drop, and an unguarded drop aborts the whole script under `set -e`. The drop is now guarded so a missing user is tolerated. If this resurfaces, confirm the guard is still in place on the dropUser line.

If `docker compose up` fails with "not a directory: Are you trying to mount a directory onto a file" naming `nginx.conf`, the host path `app/nginx/nginx.conf` was missing when compose ran, so Docker created an empty directory there. Remove it with `sudo rmdir /opt/lawfirm-crm/nginx/nginx.conf`, confirm the real config exists at `app/nginx/nginx.conf` in the repo (not one level up at `app/nginx.conf`), re-copy it, and bring the stack up again.

If `nc` from the App Server to port 27017 times out, check three things in order: the Security Group on the DB Server allows 27017 from the App Server SG; UFW on the DB Server allows 27017 from the VPC CIDR; `mongod` is bound to the private IP (not just localhost) in `/etc/mongod.conf`.

If `docker compose up` fails with a buildx permission error, run `sudo chown -R ubuntu:ubuntu /home/ubuntu/.docker` and retry.

If the SSH tunnel command appears to succeed but `curl http://127.0.0.1:3001/health` hangs, a stale tunnel process is holding the port. Kill it with `lsof -ti :3001 | xargs kill -9` and reopen the tunnel. The bind succeeds silently even when the port is taken, so the hang is the only symptom.

If the browser shows "Cannot GET /", the API port was opened directly instead of the app. The app is on `localhost:5173` (Vite); `localhost:3001` is the API tunnel and has no homepage route. Open 5173 instead.

If the frontend loads but API calls fail with 401, the JWT in localStorage is stale. Log out and log back in, or clear `localStorage` in the browser dev tools.