#!/bin/bash

echo "--- Avvio MariaDB ---"
sudo service mariadb start

echo "--- Arresto eventuali istanze Flask precedenti ---"
pkill -f "python endpoint_5F" 2>/dev/null || true
sleep 1

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
cd "$BACKEND_DIR"

echo "--- Avvio server Flask ---"
nohup python endpoint_5F_log_reg.py       > /tmp/api_log_reg.log       2>&1 &
nohup python endpoint_5F_Assicurazione.py > /tmp/api_assicurazione.log 2>&1 &
nohup python endpoint_5F_Sinistri_User.py > /tmp/api_sinistri.log      2>&1 &
nohup python endpoint_5F_Periti.py        > /tmp/api_periti.log        2>&1 &
nohup python endpoint_5F_Polizze.py       > /tmp/api_polizze.log       2>&1 &
nohup python endpoint_5F_Veicoli.py       > /tmp/api_veicoli.log       2>&1 &

echo ""
echo "Backend avviato:"
echo "  :5000  -> Assicurazioni"
echo "  :6000  -> Login / Registrazione"
echo "  :7000  -> Sinistri Utente"
echo "  :8000  -> Periti"
echo "  :9000  -> Polizze"
echo "  :10000 -> Veicoli"
echo ""
echo "Log disponibili in /tmp/api_*.log"
