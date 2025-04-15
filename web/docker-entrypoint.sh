#!/bin/sh
# vim:sw=4:ts=4:et

set -e

entrypoint_log() {
    if [ -z "${NGINX_ENTRYPOINT_QUIET_LOGS:-}" ]; then
        echo "$@"
    fi
}

if [ "$1" = "nginx" -o "$1" = "nginx-debug" ]; then
    if /usr/bin/find "/docker-entrypoint.d/" -mindepth 1 -maxdepth 1 -type f -print -quit 2>/dev/null | read v; then
        entrypoint_log "$0: /docker-entrypoint.d/ is not empty, will attempt to perform configuration"

        entrypoint_log "$0: Looking for shell scripts in /docker-entrypoint.d/"
        find "/docker-entrypoint.d/" -follow -type f -print | sort -V | while read -r f; do
            case "$f" in
                *.envsh)
                    if [ -x "$f" ]; then
                        entrypoint_log "$0: Sourcing $f";
                        . "$f"
                    else
                        # warn on shell scripts without exec bit
                        entrypoint_log "$0: Ignoring $f, not executable";
                    fi
                    ;;
                *.sh)
                    if [ -x "$f" ]; then
                        entrypoint_log "$0: Launching $f";
                        "$f"
                    else
                        # warn on shell scripts without exec bit
                        entrypoint_log "$0: Ignoring $f, not executable";
                    fi
                    ;;
                *) entrypoint_log "$0: Ignoring $f";;
            esac
        done

        entrypoint_log "$0: Configuration complete; ready for start up"
    else
        entrypoint_log "$0: No files found in /docker-entrypoint.d/, skipping configuration"
    fi
fi

VITE_APP_BACKEND=$(env | grep VITE_APP_BACKEND= | cut -d'=' -f2-)
VITE_APP_STAT_URL=$(env | grep VITE_APP_STAT_URL= | cut -d'=' -f2-)
echo "VITE_APP_BACKEND value: $VITE_APP_BACKEND"
echo "VITE_APP_STAT_URL value: $VITE_APP_STAT_URL"

if [ -n "$VITE_APP_BACKEND" ]; then
  sed -i "s|http://localhost:3000|$VITE_APP_BACKEND|g" /usr/share/nginx/html/assets/*.js
else
  echo "VITE_APP_BACKEND environment variable not found."
fi

if [ -n "$VITE_APP_STAT_URL" ]; then
  sed -i "s|http://localhost:3100|$VITE_APP_STAT_URL|g" /usr/share/nginx/html/assets.*.js
else
  echo "VITE_APP_STAT_URL environment variable not found."
fi

echo "Enviroment Variable Injection Complete."


exec "$@"