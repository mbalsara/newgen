#!/bin/sh
# Replace environment variable placeholders in env-config.js

ENV_FILE=/usr/share/nginx/html/env-config.js

# Replace placeholders with actual environment variables
sed -i "s|__VITE_API_URL__|${VITE_API_URL:-}|g" $ENV_FILE
sed -i "s|__VITE_VAPI_PUBLIC_KEY__|${VITE_VAPI_PUBLIC_KEY:-}|g" $ENV_FILE

# Start nginx
exec nginx -g "daemon off;"
