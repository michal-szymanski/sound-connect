#!/bin/bash

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT=9222
USER_DATA_DIR="/tmp/chrome-debug-sound-connect"
APP_URL="http://localhost:3000"
MAX_WAIT=60

if [ ! -f "$CHROME_PATH" ]; then
  echo "Chrome not found at $CHROME_PATH"
  exit 1
fi

echo "Waiting for app to be available at $APP_URL..."

ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -s -f -o /dev/null "$APP_URL"; then
    echo "App is ready!"
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "Timeout waiting for app to start. Launching Chrome anyway..."
fi

echo "Launching Chrome with remote debugging on port $DEBUG_PORT..."

"$CHROME_PATH" \
  --remote-debugging-port=$DEBUG_PORT \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "$APP_URL" \
  > /dev/null 2>&1 &

echo "Chrome launched with remote debugging enabled"
echo "Opening $APP_URL"
echo "DevTools Protocol available at http://localhost:$DEBUG_PORT"
