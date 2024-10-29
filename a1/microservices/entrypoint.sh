#!/bin/bash

# Start the cron service
service cron start
echo "Cron service started..."

# Verify cron job is installed
echo "Current crontab:"
crontab -l

# Keep the container running and tail the logs
tail -f /var/log/auto_reject.log /var/log/cron.log