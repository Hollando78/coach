#!/bin/bash

# Territory Game Health Check Script
# Checks multiple aspects of the territory game and sends Pushover notifications

# Configuration
HEALTH_URL="https://stevenhol.land/territory-api/health"
GAMES_URL="https://stevenhol.land/territory-api/games"
LOG_FILE="/root/project/dashboard/logs/territory-health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
ISSUES=()
STATUS="HEALTHY"

# Ensure log directory exists
mkdir -p $(dirname "$LOG_FILE")

# Function to log messages
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Function to send Pushover notification using existing system
send_pushover() {
    local title="$1"
    local message="$2"
    local priority="${3:-0}"  # Default priority 0 (normal)
    
    python3 /usr/local/bin/pushover "$message" -t "$title" -p "$priority"
}

# Check 1: API Health Endpoint
log "Checking territory API health..."
HEALTH_RESPONSE=$(curl -s --max-time 10 "$HEALTH_URL")
HEALTH_CODE=$?

if [ $HEALTH_CODE -ne 0 ]; then
    ISSUES+=("API endpoint unreachable (curl error $HEALTH_CODE)")
    STATUS="UNHEALTHY"
elif ! echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    ISSUES+=("API health check failed: $HEALTH_RESPONSE")
    STATUS="UNHEALTHY"
else
    log "✓ API health check passed"
fi

# Check 2: Container Status
log "Checking container status..."
TERRITORY_BACKEND_STATUS=$(docker inspect territory-backend --format='{{.State.Status}}' 2>/dev/null)
REDIS_STATUS=$(docker inspect multiplayer-game-redis-1 --format='{{.State.Status}}' 2>/dev/null)
POSTGRES_STATUS=$(docker inspect multiplayer-game-postgres-1 --format='{{.State.Status}}' 2>/dev/null)

if [ "$TERRITORY_BACKEND_STATUS" != "running" ]; then
    ISSUES+=("Territory backend container not running ($TERRITORY_BACKEND_STATUS)")
    STATUS="CRITICAL"
fi

if [ "$REDIS_STATUS" != "running" ]; then
    ISSUES+=("Redis container not running ($REDIS_STATUS)")
    STATUS="CRITICAL"
fi

if [ "$POSTGRES_STATUS" != "running" ]; then
    ISSUES+=("PostgreSQL container not running ($POSTGRES_STATUS)")
    STATUS="CRITICAL"
fi

# Check 3: Redis Connection
log "Checking Redis connectivity..."
REDIS_PING=$(docker exec multiplayer-game-redis-1 redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" != "PONG" ]; then
    ISSUES+=("Redis not responding to ping")
    STATUS="CRITICAL"
else
    log "✓ Redis connectivity confirmed"
fi

# Check 4: Database Connection
log "Checking PostgreSQL connectivity..."
DB_CHECK=$(docker exec multiplayer-game-postgres-1 pg_isready -U gameuser -d territory_game 2>/dev/null)
if ! echo "$DB_CHECK" | grep -q "accepting connections"; then
    ISSUES+=("PostgreSQL not accepting connections")
    STATUS="CRITICAL"
else
    log "✓ PostgreSQL connectivity confirmed"
fi

# Check 5: Recent Activity (check for recent moves in audit table)
log "Checking for recent game activity..."
RECENT_MOVES=$(docker exec multiplayer-game-postgres-1 psql -U gameuser -d territory_game -t -c "SELECT COUNT(*) FROM \"MovesAudit\" WHERE \"timestamp\" > NOW() - INTERVAL '1 hour';" 2>/dev/null | tr -d ' ')
if [[ "$RECENT_MOVES" =~ ^[0-9]+$ ]]; then
    log "✓ Found $RECENT_MOVES moves in the last hour"
    if [ "$RECENT_MOVES" -eq 0 ]; then
        # Not necessarily an issue, but worth noting
        log "ℹ No recent game activity (last hour)"
    fi
else
    ISSUES+=("Could not query recent game activity")
    STATUS="UNHEALTHY"
fi

# Check 6: Disk Space
log "Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    ISSUES+=("Disk usage high: ${DISK_USAGE}%")
    STATUS="WARNING"
elif [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠ Disk usage: ${DISK_USAGE}%"
else
    log "✓ Disk usage: ${DISK_USAGE}%"
fi

# Check 7: Memory Usage
log "Checking memory usage..."
MEMORY_USAGE=$(free | grep '^Mem:' | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    ISSUES+=("Memory usage high: ${MEMORY_USAGE}%")
    STATUS="WARNING"
else
    log "✓ Memory usage: ${MEMORY_USAGE}%"
fi

# Summary and Notifications
log "Health check completed. Status: $STATUS"

if [ ${#ISSUES[@]} -eq 0 ]; then
    # All healthy - send notification only every 12 hours to avoid spam
    LAST_OK_FILE="/tmp/territory-health-last-ok"
    if [ ! -f "$LAST_OK_FILE" ] || [ $(($(date +%s) - $(stat -c %Y "$LAST_OK_FILE" 2>/dev/null || echo 0))) -gt 43200 ]; then
        send_pushover "Territory Game Healthy" "All systems operational. Recent activity: $RECENT_MOVES moves/hour. Disk: ${DISK_USAGE}%, Memory: ${MEMORY_USAGE}%"
        touch "$LAST_OK_FILE"
    fi
else
    # Issues found - always notify
    ISSUE_LIST=$(printf "%s\n" "${ISSUES[@]}")
    case "$STATUS" in
        "CRITICAL")
            send_pushover "🚨 Territory Game CRITICAL" "$ISSUE_LIST" 1
            ;;
        "UNHEALTHY")
            send_pushover "⚠️ Territory Game Issues" "$ISSUE_LIST"
            ;;
        "WARNING")
            send_pushover "⚡ Territory Game Warning" "$ISSUE_LIST"
            ;;
    esac
    
    log "Issues found:"
    printf '%s\n' "${ISSUES[@]}" | tee -a "$LOG_FILE"
fi

log "Health check finished"
echo "Status: $STATUS"
exit 0