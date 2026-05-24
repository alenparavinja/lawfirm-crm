#!/bin/bash
# app-extras.sh
# App Server hardening applied after common.sh.
# Prepares the host for Node.js and Nginx in later phases without
# installing the application stack itself.

set -euo pipefail

echo "[app-extras] starting at $(date -Iseconds)"

export DEBIAN_FRONTEND=noninteractive

# Build prerequisites for Node.js native modules and general utilities.
apt-get install -y build-essential curl git

# 1 GB swap to absorb Node.js memory spikes and npm install peaks
# on a 1 GB instance. Idempotent: skipped if swap already exists.
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Application-tier UFW rules. Ports stay closed at the Security Group
# layer until Phase 4, so opening them here does not expose anything
# externally. Defense in depth requires both layers to allow traffic.
ufw allow 80/tcp comment 'HTTP - Nginx'
ufw allow 443/tcp comment 'HTTPS - Nginx'

# Node.js port restricted to the VPC CIDR. Nginx will reverse-proxy
# to localhost in production; this rule is a backstop in case of
# misconfiguration.
ufw allow from 10.0.0.0/16 to any port 3000 proto tcp comment 'Node.js from VPC only'

ufw reload

# ---- AWS CLI and jq ----
# Required by start.sh to fetch the app credential from Secrets Manager
# at container launch time. Mirrors what db-extras.sh installs on the DB Server.

apt-get install -y jq unzip
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

# ---- Docker ----
# Official Docker apt repo rather than Ubuntu's snap or the distro package,
# which lags behind and has caused compose compatibility issues.

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

apt-get update --error-on=any
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow ubuntu user to run docker without sudo.
usermod -aG docker ubuntu

systemctl enable --now docker

# Completion marker for the audit script.
echo "app-extras completed at $(date -Iseconds)" > /var/log/app-extras.complete

echo "[app-extras] finished at $(date -Iseconds)"
