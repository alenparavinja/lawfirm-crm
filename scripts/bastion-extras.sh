#!/bin/bash
# bastion-extras.sh
# Bastion-specific hardening applied after common.sh runs.
# Scope is intentionally minimal: this host is a jump box and nothing else.

set -euo pipefail

echo "[bastion-extras] starting at $(date -Iseconds)"

# Persistent terminal sessions for long-running ops over SSH.
apt-get install -y tmux

# Explicit ProxyJump support. Ubuntu's default already allows agent
# forwarding, but pinning it in code keeps the behavior auditable
# rather than dependent on distribution defaults.
cat > /etc/ssh/sshd_config.d/97-bastion.conf <<'EOF'
AllowAgentForwarding yes
AllowTcpForwarding yes
EOF

systemctl restart ssh

# 512 MB swap as a safety net for unattended-upgrades on a 1 GB instance.
# Skipped if a swap file already exists from a previous run.
if [ ! -f /swapfile ]; then
    fallocate -l 512M /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Completion marker for the audit script.
echo "bastion-extras completed at $(date -Iseconds)" > /var/log/bastion-extras.complete

echo "[bastion-extras] finished at $(date -Iseconds)"
