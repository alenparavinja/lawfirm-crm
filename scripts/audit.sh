#!/bin/bash
# audit.sh
# Verifies hardening applied by common.sh and the tier-specific extras.
# Run on any of the three instances with sudo. Detects tier from the
# completion marker files written by the user_data scripts.
#
# Usage: sudo bash audit.sh
# Exit 0 if all checks pass, 1 if any failed.

set -uo pipefail

passed=0
failed=0

check() {
    local description="$1"
    local actual="$2"
    local expected="$3"

    if [[ "$actual" == "$expected" ]]; then
        printf '[PASS] %s\n' "$description"
        ((passed++))
    else
        printf '[FAIL] %s (expected: %s, got: %s)\n' "$description" "$expected" "$actual"
        ((failed++))
    fi
}

# Same as check() but matches a substring rather than exact equality.
# Useful for service status output that may include extra context.
check_contains() {
    local description="$1"
    local actual="$2"
    local needle="$3"

    if [[ "$actual" == *"$needle"* ]]; then
        printf '[PASS] %s\n' "$description"
        ((passed++))
    else
        printf '[FAIL] %s (expected to contain: %s, got: %s)\n' "$description" "$needle" "$actual"
        ((failed++))
    fi
}

# Tier detection from completion markers left by the user_data scripts.
tier="unknown"
if [[ -f /var/log/bastion-extras.complete ]]; then
    tier="bastion"
elif [[ -f /var/log/app-extras.complete ]]; then
    tier="app"
elif [[ -f /var/log/db-extras.complete ]]; then
    tier="db"
fi

echo "=== Hardening audit on $(hostname) (tier: $tier) ==="
echo

# ---- common.sh checks ----

echo "--- common baseline ---"

check "common-harden completion marker present" \
    "$([[ -f /var/log/common-harden.complete ]] && echo present || echo missing)" \
    "present"

# SSH effective config (sshd -T dumps post-include resolved config)
sshd_config=$(sshd -T 2>/dev/null)
check "SSH root login disabled" \
    "$(echo "$sshd_config" | awk '/^permitrootlogin/ {print $2}')" "no"
check "SSH password auth disabled" \
    "$(echo "$sshd_config" | awk '/^passwordauthentication/ {print $2}')" "no"
check "SSH empty passwords disabled" \
    "$(echo "$sshd_config" | awk '/^permitemptypasswords/ {print $2}')" "no"
check "SSH MaxAuthTries is 3" \
    "$(echo "$sshd_config" | awk '/^maxauthtries/ {print $2}')" "3"
check "SSH LoginGraceTime is 30" \
    "$(echo "$sshd_config" | awk '/^logingracetime/ {print $2}')" "30"
check "SSH banner configured" \
    "$(echo "$sshd_config" | awk '/^banner/ {print $2}')" "/etc/issue.net"
check "Banner file present" \
    "$([[ -f /etc/issue.net ]] && echo present || echo missing)" "present"

# UFW
ufw_status=$(ufw status verbose 2>/dev/null || true)
check_contains "UFW is active" "$ufw_status" "Status: active"
check_contains "UFW default incoming is deny" "$ufw_status" "deny (incoming)"
check_contains "UFW allows port 22" "$ufw_status" "22/tcp"

# fail2ban
check "fail2ban service active" \
    "$(systemctl is-active fail2ban 2>/dev/null)" "active"
check "fail2ban service enabled" \
    "$(systemctl is-enabled fail2ban 2>/dev/null)" "enabled"
fail2ban_status=$(fail2ban-client status sshd 2>/dev/null || true)
check_contains "fail2ban sshd jail active" "$fail2ban_status" "Currently banned"

# Unattended upgrades
check "unattended-upgrades package installed" \
    "$(dpkg-query -W -f='${Status}' unattended-upgrades 2>/dev/null | awk '{print $3}')" \
    "installed"
check "unattended-upgrades service enabled" \
    "$(systemctl is-enabled unattended-upgrades 2>/dev/null)" "enabled"

# Kernel sysctl
check "ip_forward disabled" \
    "$(sysctl -n net.ipv4.ip_forward)" "0"
check "send_redirects disabled" \
    "$(sysctl -n net.ipv4.conf.all.send_redirects)" "0"
check "accept_redirects disabled" \
    "$(sysctl -n net.ipv4.conf.all.accept_redirects)" "0"
check "accept_source_route disabled" \
    "$(sysctl -n net.ipv4.conf.all.accept_source_route)" "0"
check "log_martians enabled on primary interface" \
    "$(sysctl -n "net.ipv4.conf.$(ip -o -4 route show to default | awk '{print $5}').log_martians" 2>/dev/null)" \
    "1"
check "tcp_syncookies enabled" \
    "$(sysctl -n net.ipv4.tcp_syncookies)" "1"

# AppArmor
check "AppArmor service active" \
    "$(systemctl is-active apparmor 2>/dev/null)" "active"

# ---- tier-specific checks ----

echo
echo "--- $tier extras ---"

case "$tier" in
    bastion)
        check "bastion-extras completion marker present" \
            "$([[ -f /var/log/bastion-extras.complete ]] && echo present || echo missing)" \
            "present"
        check "tmux installed" \
            "$(dpkg-query -W -f='${Status}' tmux 2>/dev/null | awk '{print $3}')" \
            "installed"
        check "swap is active" \
            "$(swapon --show=NAME --noheadings | head -1 | xargs -r basename || echo none)" \
            "swapfile"
        check "swap size is approximately 512MB" \
            "$(swapon --show=SIZE --noheadings | head -1 | tr -d ' ')" \
            "512M"
        check "agent forwarding enabled" \
            "$(echo "$sshd_config" | awk '/^allowagentforwarding/ {print $2}')" "yes"
        ;;

    app)
        check "app-extras completion marker present" \
            "$([[ -f /var/log/app-extras.complete ]] && echo present || echo missing)" \
            "present"
        check "build-essential installed" \
            "$(dpkg-query -W -f='${Status}' build-essential 2>/dev/null | awk '{print $3}')" \
            "installed"
        check "curl installed" \
            "$(dpkg-query -W -f='${Status}' curl 2>/dev/null | awk '{print $3}')" \
            "installed"
        check "git installed" \
            "$(dpkg-query -W -f='${Status}' git 2>/dev/null | awk '{print $3}')" \
            "installed"
        check "swap size is approximately 1GB" \
            "$(swapon --show=SIZE --noheadings | head -1 | tr -d ' ')" \
            "1024M"
        ufw_status=$(ufw status verbose 2>/dev/null || true)
        check_contains "UFW allows port 80" "$ufw_status" "80/tcp"
        check_contains "UFW allows port 443" "$ufw_status" "443/tcp"
        check_contains "UFW allows port 3000 from VPC" "$ufw_status" "3000/tcp"
        ;;

    db)
        check "db-extras completion marker present" \
            "$([[ -f /var/log/db-extras.complete ]] && echo present || echo missing)" \
            "present"
        check "gnupg installed" \
            "$(dpkg-query -W -f='${Status}' gnupg 2>/dev/null | awk '{print $3}')" \
            "installed"
        check "swap size is approximately 2GB" \
            "$(swapon --show=SIZE --noheadings | head -1 | tr -d ' ')" \
            "2G"
        check "swappiness is 1" \
            "$(sysctl -n vm.swappiness)" "1"
        check "Transparent Huge Pages disabled (enabled)" \
            "$(cat /sys/kernel/mm/transparent_hugepage/enabled | grep -oP '\[\K[^\]]+')" \
            "never"
        check "Transparent Huge Pages disabled (defrag)" \
            "$(cat /sys/kernel/mm/transparent_hugepage/defrag | grep -oP '\[\K[^\]]+')" \
            "never"
        check "disable-thp service enabled" \
            "$(systemctl is-enabled disable-thp.service 2>/dev/null)" "enabled"
        check "mongod ulimit config present" \
            "$([[ -f /etc/security/limits.d/99-mongodb.conf ]] && echo present || echo missing)" \
            "present"
        ufw_status=$(ufw status verbose 2>/dev/null || true)
        check_contains "UFW allows port 27017 from VPC" "$ufw_status" "27017/tcp"
        ;;

    unknown)
        echo "[WARN] Could not detect tier. No tier-specific completion marker found."
        echo "[WARN] User_data may have failed before writing markers. Check /var/log/user-data.log"
        ((failed++))
        ;;
esac

# ---- summary ----

echo
echo "=== $passed passed, $failed failed ==="

if (( failed > 0 )); then
    exit 1
fi
exit 0
