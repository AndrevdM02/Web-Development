#!/usr/bin/env bash
SCRIPT="stackoverflow_scraper.py"
TIMEOUT=30
PORT=23467
export STACKOVERFLOW_API_PORT=$PORT
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 $SCRIPT &
while ! $(curl -s localhost:$PORT > /dev/null) && [ $TIMEOUT -gt 0 ] do
sleep 1; ((TIMEOUT--)) ; done
pkill -f $SCRIPT
deactivate
if [ $TIMEOUT -gt 0 ]; then echo "Verified"; else echo "Failed"; fi