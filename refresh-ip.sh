#!/usr/bin/env bash
# refresh-ip.sh
# Detects current public IP and updates the Bastion SG ingress rule via Terraform.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TFVARS_FILE="terraform.tfvars"

if [[ ! -f "$TFVARS_FILE" ]]; then
  echo -e "${RED}Error:${NC} $TFVARS_FILE not found. Run from project root."
  exit 1
fi

echo -e "${YELLOW}Detecting public IP...${NC}"
NEW_IP=$(curl -s --max-time 10 https://checkip.amazonaws.com | tr -d '[:space:]')

if [[ ! "$NEW_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
  echo -e "${RED}Error:${NC} invalid IP returned: '$NEW_IP'"
  exit 1
fi

NEW_CIDR="${NEW_IP}/32"
echo -e "Public IP: ${GREEN}${NEW_IP}${NC}"

CURRENT_CIDR=$(grep -E '^your_ip_cidr' "$TFVARS_FILE" \
  | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')

if [[ "$CURRENT_CIDR" == "$NEW_CIDR" ]]; then
  echo -e "${GREEN}IP unchanged.${NC}"
  exit 0
fi

echo -e "Old: ${YELLOW}${CURRENT_CIDR}${NC} → New: ${GREEN}${NEW_CIDR}${NC}"

sed -i.bak -E "s|^your_ip_cidr[[:space:]]*=.*|your_ip_cidr = \"${NEW_CIDR}\"|" "$TFVARS_FILE"
rm -f "${TFVARS_FILE}.bak"

terraform apply -auto-approve

echo -e "${GREEN}SG updated.${NC}"
