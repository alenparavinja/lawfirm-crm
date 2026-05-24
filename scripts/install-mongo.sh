#!/bin/bash
# install-mongo.sh
# Installs and secures MongoDB 7 Community on the DB Server.
# Fetches the admin credential from Secrets Manager via the instance role,
# bootstraps the admin user, then enables authentication.
# Run with sudo on the DB Server. Output to /var/log/install-mongo.log.

set -euo pipefail
exec > >(tee /var/log/install-mongo.log) 2>&1

echo "[install-mongo] starting at $(date -Iseconds)"

SECRET_ID="lawfirm-crm/mongo-admin"
REGION="us-east-1"
MONGO_VERSION="7.0"

# Private IP of this instance, used as a bind address so the App Server
# can reach Mongo while the public internet cannot.
PRIVATE_IP=$(ip -o -4 addr show "$(ip -o -4 route show to default | awk '{print $5}')" | awk '{print $4}' | cut -d/ -f1)
echo "[install-mongo] private IP detected as $PRIVATE_IP"

# Fetch admin credentials from Secrets Manager. The instance role grants
# read access to this one secret; no credentials are stored on the host.
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ID" --region "$REGION" \
    --query SecretString --output text)
ADMIN_USER=$(echo "$SECRET_JSON" | jq -r .username)
ADMIN_PASS=$(echo "$SECRET_JSON" | jq -r .password)

# Add the MongoDB official apt repository. The vendor repo carries current
# releases; Ubuntu's bundled package is several major versions behind.
curl -fsSL "https://www.mongodb.org/static/pgp/server-${MONGO_VERSION}.asc" \
    -o /tmp/mongodb-server-${MONGO_VERSION}.asc
rm -f /usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg
gpg --batch --dearmor \
    -o /usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg \
    /tmp/mongodb-server-${MONGO_VERSION}.asc

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/${MONGO_VERSION} multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-${MONGO_VERSION}.list

export DEBIAN_FRONTEND=noninteractive
apt-get update --error-on=any
apt-get install -y mongodb-org

# Configure mongod. Cap WiredTiger cache so Mongo does not contend with
# the OS for the 1 GB of RAM. Bind to localhost plus the private IP only.
# Authorization is enabled here but the admin user must exist first, so
# the user is created in a pre-auth pass below before this config is active.
cat > /etc/mongod.conf <<EOF
storage:
  dbPath: /var/lib/mongodb
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1,${PRIVATE_IP}

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOF

# Bootstrap the admin user. Authorization cannot be on while creating the
# first user, so start mongod without the config's auth, create the user,
# then restart with auth enabled.
echo "[install-mongo] starting mongod without auth to bootstrap admin user"
mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 --fork \
    --logpath /var/log/mongodb/mongod-bootstrap.log

# Wait for mongod to accept connections.
for attempt in {1..30}; do
    if mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
        break
    fi
    if [[ $attempt -eq 30 ]]; then
        echo "[install-mongo] mongod did not become ready"
        exit 1
    fi
    sleep 1
done

echo "[install-mongo] creating admin user"
mongosh --quiet admin --eval "
db.dropUser('${ADMIN_USER}');
db.createUser({
  user: '${ADMIN_USER}',
  pwd: '${ADMIN_PASS}',
  roles: [ { role: 'root', db: 'admin' } ]
})
"

# Shut down the bootstrap instance cleanly.
mongosh --quiet admin --eval 'db.shutdownServer()' || true
sleep 3

# Ensure data directory ownership is correct for the mongodb service user.
chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

# Start mongod under systemd with the auth-enabled config.
echo "[install-mongo] starting mongod under systemd with auth enabled"
systemctl enable --now mongod
sleep 5

# Verify authenticated connection works.
echo "[install-mongo] verifying authenticated login"
mongosh --quiet \
    -u "$ADMIN_USER" -p "$ADMIN_PASS" --authenticationDatabase admin \
    --eval 'db.adminCommand({ listDatabases: 1 }).databases.map(d => d.name)'

# ---- Create app user ----
# Separate MongoDB user with readWrite on lawfirm only. Created here so
# the app server never needs the admin credential at any point.

echo "[install-mongo] creating app user"

APP_SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "lawfirm-crm/mongo-app" --region "$REGION" \
    --query SecretString --output text)
APP_USER=$(echo "$APP_SECRET_JSON" | jq -r .username)
APP_PASS=$(echo "$APP_SECRET_JSON" | jq -r .password)

# Drop first so re-runs are idempotent.
mongosh --quiet \
    -u "$ADMIN_USER" -p "$ADMIN_PASS" --authenticationDatabase admin \
    --eval "db.getSiblingDB('lawfirm').dropUser('${APP_USER}');" 2>/dev/null || true

mongosh --quiet \
    -u "$ADMIN_USER" -p "$ADMIN_PASS" --authenticationDatabase admin \
    --eval "
db.getSiblingDB('lawfirm').createUser({
  user: '${APP_USER}',
  pwd: '${APP_PASS}',
  roles: [{ role: 'readWrite', db: 'lawfirm' }]
});
"

echo "[install-mongo] app user created"

echo "install-mongo completed at $(date -Iseconds)" > /var/log/install-mongo.complete
echo "[install-mongo] finished at $(date -Iseconds)"
