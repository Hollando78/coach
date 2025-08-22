#!/bin/bash

# Security monitoring script for cryptocurrency mining detection
# Monitors for high CPU processes and suspicious activity

LOGFILE="/root/project/dashboard/logs/security-monitor.log"
ALERT_THRESHOLD=80  # CPU percentage threshold

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

check_high_cpu() {
    # Find processes using >80% CPU
    high_cpu_procs=$(ps aux --sort=-%cpu | awk 'NR>1 && $3>80 {print $2, $3, $11}' | head -10)
    
    if [ ! -z "$high_cpu_procs" ]; then
        log_message "HIGH CPU ALERT: Processes over 80% CPU detected"
        echo "$high_cpu_procs" >> "$LOGFILE"
        
        # Check for suspicious process names
        if echo "$high_cpu_procs" | grep -iE "(rediserver|miner|xmrig|cryptonight|stratum)"; then
            log_message "CRITICAL: Cryptocurrency mining process detected!"
            python3 /usr/local/bin/pushover "SECURITY ALERT: Cryptocurrency mining detected on server!" -t "Security Alert" -p 1
        fi
    fi
}

check_container_ports() {
    # Check for containers exposing dangerous ports to 0.0.0.0
    exposed_ports=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "0\.0\.0\.0:(5432|6379|3306|27017)" | head -5)
    
    if [ ! -z "$exposed_ports" ]; then
        log_message "SECURITY RISK: Database containers exposed to internet"
        echo "$exposed_ports" >> "$LOGFILE"
        python3 /usr/local/bin/pushover "Database containers exposed to internet!" -t "Security Alert" -p 2
    fi
}

check_failed_logins() {
    # Check for recent failed login attempts
    failed_logins=$(journalctl --since "1 hour ago" | grep -i "failed\|invalid\|authentication failure" | wc -l)
    
    if [ "$failed_logins" -gt 20 ]; then
        log_message "ALERT: $failed_logins failed login attempts in last hour"
        python3 /usr/local/bin/pushover "$failed_logins failed login attempts detected in last hour" -t "Login Alert"
    fi
}

check_disk_space() {
    # Check disk usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        log_message "ALERT: Disk usage at ${disk_usage}%"
        python3 /usr/local/bin/pushover "Disk usage critical: ${disk_usage}%" -t "System Alert"
    fi
}

# Main monitoring loop
log_message "Security monitor started"
check_high_cpu
check_container_ports
check_failed_logins 
check_disk_space
log_message "Security monitor completed"