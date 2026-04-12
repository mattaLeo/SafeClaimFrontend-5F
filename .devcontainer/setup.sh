#!/bin/bash
set -e

echo "--- [1/4] Installazione dipendenze Python ---"
pip install flask flask-cors mysql-connector-python "pymongo[srv]"

echo "--- [2/4] Installazione dipendenze Angular ---"
npm install

echo "--- [3/4] Configurazione MySQL ---"
sudo service mysql start
sudo mysql -e "CREATE USER IF NOT EXISTS 'pythonuser'@'localhost' IDENTIFIED BY 'password123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'pythonuser'@'localhost' WITH GRANT OPTION;"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "--- [4/4] Setup database e dati iniziali ---"
WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE_ROOT/backend"
python db_locale.py

echo ""
echo "Setup completato!"
