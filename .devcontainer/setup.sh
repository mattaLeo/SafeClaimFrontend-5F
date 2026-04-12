#!/bin/bash
set -e

echo "--- [1/5] Installazione MariaDB ---"
sudo apt-get update -qq
sudo apt-get install -y -qq mariadb-server
sudo service mariadb start

echo "--- [2/5] Configurazione utente MySQL ---"
sudo mariadb -e "CREATE USER IF NOT EXISTS 'pythonuser'@'localhost' IDENTIFIED BY 'password123';"
sudo mariadb -e "GRANT ALL PRIVILEGES ON *.* TO 'pythonuser'@'localhost' WITH GRANT OPTION;"
sudo mariadb -e "FLUSH PRIVILEGES;"

echo "--- [3/5] Installazione dipendenze Python ---"
pip install flask flask-cors mysql-connector-python "pymongo[srv]"

echo "--- [4/5] Installazione dipendenze Angular ---"
WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE_ROOT/Frontend-5F"
npm install
cd "$WORKSPACE_ROOT"

echo "--- [5/5] Setup database e dati iniziali ---"
cd "$WORKSPACE_ROOT/backend"
python db_locale.py

echo ""
echo "Setup completato!"
