#!/bin/bash
# common.sh
# Shared hardening baseline applied to every instance via EC2 user_data.
# Output captured to /var/log/user-data.log for post-mortem inspection.

set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "[common-harden] starting at $(date -Iseconds)"

# Wait for cloud-init to release the apt lock before patching.
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    sleep 2
done

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# SSH lockdown via drop-in config. Drop-ins survive package updates
# and are easier to roll back than edits to the main sshd_config.
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
LoginGraceTime 30
MaxAuthTries 3
EOF

systemctl restart ssh

# UFW host firewall as defense in depth on top of AWS Security Groups.
# Tier-specific scripts open additional ports as needed.
apt-get install -y ufw

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw --force enable

# fail2ban with a tightened SSH jail. Bans an IP after 3 failures
# within 10 minutes for 1 hour.
apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 3
findtime = 10m
bantime = 1h
EOF

systemctl enable --now fail2ban

# Automatic security updates. Default config is conservative
# (security-only, no auto-reboot), which suits this environment.
apt-get install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades
systemctl enable --now unattended-upgrades

# Kernel network hardening. Disables features only routers need
# and turns on basic anti-spoof and anti-flood protections.
cat > /etc/sysctl.d/99-hardening.conf <<'EOF'
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.tcp_syncookies = 1
EOF

sysctl -p /etc/sysctl.d/99-hardening.conf

# AppArmor sanity check. Ubuntu enables it by default; the audit
# script later confirms the service is running.
systemctl enable --now apparmor

# Pre-login legal banner. Required for most compliance frameworks
# and displayed before authentication on every SSH connection.
cat > /etc/issue.net <<'EOF'
**********************************************************************
                          AUTHORIZED ACCESS ONLY

  This system is restricted to authorized users for legitimate
  business purposes. All activity is logged and monitored.
  Unauthorized access or use is prohibited and may be subject to
  criminal and civil penalties.
**********************************************************************
EOF

cat > /etc/ssh/sshd_config.d/98-banner.conf <<'EOF'
Banner /etc/issue.net
EOF

systemctl restart ssh

# Completion marker. Audit script verifies this file exists.
echo "common-harden completed at $(date -Iseconds)" > /var/log/common-harden.complete

echo "[common-harden] finished at $(date -Iseconds)"
