#!/bin/bash
# db-extras.sh
# DB Server hardening applied after common.sh.
# Prepares the host for MongoDB: swap, kernel tuning, Mongo-specific
# OS requirements (THP off, raised ulimits, gnupg for the apt repo).
# Does not install MongoDB itself; that is Phase 3.

set -euo pipefail

echo "[db-extras] starting at $(date -Iseconds)"

export DEBIAN_FRONTEND=noninteractive

# gnupg is required to import the MongoDB apt repository signing key
# in Phase 3. Installing it here keeps Phase 3 free of OS-prep work.
apt-get install -y gnupg

# jq parses the JSON secret from Secrets Manager during the Mongo install.
apt-get install -y jq

# AWS CLI v2 fetches the Mongo admin credential from Secrets Manager via
# the instance role. Not available in apt; installed from the official bundle.
apt-get install -y unzip
curl -sf "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

# 2 GB swap. MongoDB on a 1 GB instance needs a meaningful safety net
# to avoid OOM kills when WiredTiger cache and the OS file cache compete.
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Swappiness pinned low. Default of 60 happily swaps active pages,
# which is catastrophic for a database. A value of 1 reserves swap
# for emergencies only.
echo 'vm.swappiness = 1' > /etc/sysctl.d/98-mongodb.conf
sysctl -p /etc/sysctl.d/98-mongodb.conf

# Transparent Huge Pages disabled. MongoDB documentation requires this;
# THP causes memory fragmentation and unpredictable latency for databases.
# Disabled at runtime and persistently via a systemd unit.
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag

cat > /etc/systemd/system/disable-thp.service <<'EOF'
[Unit]
Description=Disable Transparent Huge Pages (THP)
DefaultDependencies=no
After=sysinit.target local-fs.target
Before=mongod.service

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo never | tee /sys/kernel/mm/transparent_hugepage/enabled /sys/kernel/mm/transparent_hugepage/defrag > /dev/null'

[Install]
WantedBy=basic.target
EOF

systemctl daemon-reload
systemctl enable disable-thp.service

# Raised ulimits for the future mongod user. MongoDB recommends
# 64000 for both file descriptors and processes.
cat > /etc/security/limits.d/99-mongodb.conf <<'EOF'
mongod soft nofile 64000
mongod hard nofile 64000
mongod soft nproc 64000
mongod hard nproc 64000
EOF

# UFW rule for MongoDB traffic restricted to the VPC range.
# The Security Group already restricts to the App Server SG;
# this is the second layer.
ufw allow from 10.0.0.0/16 to any port 27017 proto tcp comment 'MongoDB from VPC only'
ufw reload

# Completion marker for the audit script.
echo "db-extras completed at $(date -Iseconds)" > /var/log/db-extras.complete

echo "[db-extras] finished at $(date -Iseconds)"
