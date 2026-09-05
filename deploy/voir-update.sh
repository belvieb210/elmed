#!/bin/bash
# Suivre les mises à jour automatiques (cron chaque minute)
# Usage : bash deploy/voir-update.sh
#    ou : tail -f /var/log/elmed-update.log

touch /var/log/elmed-update.log /var/log/elmed-maj.log
echo "Journal parallèle : /var/log/elmed-maj.log"
echo "Suivi en direct de /var/log/elmed-update.log (Ctrl+C pour quitter)"
echo "--------------------------------------------------------------"
tail -f /var/log/elmed-update.log
