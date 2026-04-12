#!/bin/bash
# =============================================================
#  SafeClaim - Script di setup completo
#  Uso: bash setup_safeclaim.sh
#  Da eseguire nella ROOT del progetto Angular nel Codespace
# =============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SafeClaim]${NC} $1"; }
warn() { echo -e "${YELLOW}[SafeClaim]${NC} $1"; }

log "Avvio setup SafeClaim..."
echo ""

# ==============================================================
# STEP 1 — Crea struttura cartelle
# ==============================================================
log "[1/6] Creazione struttura cartelle..."
mkdir -p backend .devcontainer

# ==============================================================
# STEP 2 — Scrivi tutti i file Python del backend
# ==============================================================
log "[2/6] Scrittura file backend Python..."

cat > backend/db_locale.py << 'PYEOF'
import mysql.connector
from mysql.connector import Error

def create_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="pythonuser",
            password="password123"
        )
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS gestione_assicurazioni")
            cursor.execute("USE gestione_assicurazioni")
            return connection, cursor
    except Error as e:
        print(f"Errore durante la connessione: {e}")
        return None, None

def setup_database():
    conn, cursor = create_connection()
    if not conn: return

    tables = [
        """CREATE TABLE IF NOT EXISTS Assicuratore (
            id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(50) NOT NULL, cognome VARCHAR(50) NOT NULL,
            cf VARCHAR(16) UNIQUE NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, psw VARCHAR(255) NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS Assicurazione (
            id INT PRIMARY KEY AUTO_INCREMENT, ragione_sociale VARCHAR(100) NOT NULL, nome VARCHAR(100), telefono VARCHAR(20)
        )""",
        """CREATE TABLE IF NOT EXISTS Automobilista (
            id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(50) NOT NULL, cognome VARCHAR(50) NOT NULL,
            cf VARCHAR(16) UNIQUE NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, psw VARCHAR(255) NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS Azienda (
            id INT PRIMARY KEY AUTO_INCREMENT, ragione_sociale VARCHAR(100) NOT NULL, partita_iva VARCHAR(11) UNIQUE NOT NULL,
            sede_legale VARCHAR(200), email VARCHAR(100), telefono VARCHAR(20)
        )""",
        """CREATE TABLE IF NOT EXISTS Documenti_Anagrafica (
            id INT PRIMARY KEY AUTO_INCREMENT, entita_tipo ENUM('automobilista', 'perito', 'officina', 'assicurazione', 'soccorso') NOT NULL,
            entita_id INT NOT NULL, mongo_doc_id VARCHAR(24) NOT NULL, tipo_documento VARCHAR(50) NOT NULL,
            descrizione VARCHAR(255), data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP, data_scadenza DATE
        )""",
        """CREATE TABLE IF NOT EXISTS Officina (
            id INT PRIMARY KEY AUTO_INCREMENT, ragione_sociale VARCHAR(100) NOT NULL, citta VARCHAR(50),
            indirizzo VARCHAR(200), telefono VARCHAR(20), email VARCHAR(100), latitudine DECIMAL(10, 8), longitudine DECIMAL(11, 8)
        )""",
        """CREATE TABLE IF NOT EXISTS Perito (
            id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(50) NOT NULL, cognome VARCHAR(50) NOT NULL,
            cf VARCHAR(16) UNIQUE, email VARCHAR(100) UNIQUE NOT NULL, psw VARCHAR(255), latitudine DECIMAL(10, 8), longitudine DECIMAL(11, 8)
        )""",
        """CREATE TABLE IF NOT EXISTS Veicolo (
            id INT PRIMARY KEY AUTO_INCREMENT, targa VARCHAR(10) UNIQUE NOT NULL, n_telaio VARCHAR(17) UNIQUE,
            marca VARCHAR(50), modello VARCHAR(50), anno_immatricolazione YEAR, automobilista_id INT, azienda_id INT,
            CONSTRAINT fk_veicolo_automobilista FOREIGN KEY (automobilista_id) REFERENCES Automobilista(id) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT fk_veicolo_azienda FOREIGN KEY (azienda_id) REFERENCES Azienda(id) ON DELETE SET NULL ON UPDATE CASCADE
        )""",
        """CREATE TABLE IF NOT EXISTS Polizza (
            id INT PRIMARY KEY AUTO_INCREMENT, n_polizza VARCHAR(50) UNIQUE NOT NULL, compagnia_assicurativa VARCHAR(100),
            data_inizio DATE NOT NULL, data_scadenza DATE NOT NULL, massimale DECIMAL(12, 2),
            tipo_copertura ENUM('RCA', 'Kasko', 'Full') DEFAULT 'RCA', veicolo_id INT, assicuratore_id INT,
            documento_mongo_id VARCHAR(24),
            CONSTRAINT fk_polizza_veicolo FOREIGN KEY (veicolo_id) REFERENCES Veicolo(id) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT fk_polizza_assicuratore FOREIGN KEY (assicuratore_id) REFERENCES Assicuratore(id) ON DELETE SET NULL ON UPDATE CASCADE
        )""",
        """CREATE TABLE IF NOT EXISTS Polizza_Documenti (
            id INT PRIMARY KEY AUTO_INCREMENT, polizza_id INT NOT NULL, mongo_doc_id VARCHAR(24) NOT NULL,
            tipo_documento ENUM('polizza_pdf', 'quietanza') NOT NULL, descrizione VARCHAR(255),
            data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_polizza_documenti_polizza FOREIGN KEY (polizza_id) REFERENCES Polizza(id) ON DELETE CASCADE ON UPDATE CASCADE
        )"""
    ]

    for table in tables:
        cursor.execute(table)
    conn.commit()
    print("Database e tabelle create con successo.")

    inserts = {
        "Assicuratore": ("INSERT IGNORE INTO Assicuratore (nome, cognome, cf, email, psw) VALUES (%s,%s,%s,%s,%s)", [
            (f'NomeA{i}', f'CognomeA{i}', f'CFASSICURAT{i:05}', f'ass{i}@test.it', 'hash_psw') for i in range(1, 11)
        ]),
        "Assicurazione": ("INSERT IGNORE INTO Assicurazione (ragione_sociale, nome, telefono) VALUES (%s,%s,%s)", [
            (f'Assicura Spa {i}', f'Agenzia {i}', f'0200000{i}') for i in range(1, 11)
        ]),
        "Automobilista": ("INSERT IGNORE INTO Automobilista (nome, cognome, cf, email, psw) VALUES (%s,%s,%s,%s,%s)", [
            (f'Auto{i}', f'Cognome{i}', f'CFDRIVER{i:07}', f'driver{i}@test.it', 'hash_psw') for i in range(1, 11)
        ]),
        "Azienda": ("INSERT IGNORE INTO Azienda (ragione_sociale, partita_iva, sede_legale, email) VALUES (%s,%s,%s,%s)", [
            (f'Azienda Srl {i}', f'{i:011}', f'Via Roma {i}', f'info@azienda{i}.it') for i in range(1, 11)
        ]),
        "Officina": ("INSERT IGNORE INTO Officina (ragione_sociale, citta, telefono, latitudine, longitudine) VALUES (%s,%s,%s,%s,%s)", [
            (f'Garage {i}', 'Milano', f'0211111{i}', 45.4642, 9.1900) for i in range(1, 11)
        ]),
        "Perito": ("INSERT IGNORE INTO Perito (nome, cognome, cf, email, latitudine, longitudine) VALUES (%s,%s,%s,%s,%s,%s)", [
            (f'Perito{i}', f'Rossi{i}', f'CFPERITO{i:07}', f'perito{i}@studiovr.it', 45.0, 9.0) for i in range(1, 11)
        ]),
        "Veicolo": ("INSERT IGNORE INTO Veicolo (targa, n_telaio, marca, modello, anno_immatricolazione, automobilista_id) VALUES (%s,%s,%s,%s,%s,%s)", [
            (f'AA{i:03}BB', f'VIN{i:014}', 'Fiat', 'Panda', 2020, i) for i in range(1, 11)
        ]),
        "Polizza": ("INSERT IGNORE INTO Polizza (n_polizza, compagnia_assicurativa, data_inizio, data_scadenza, massimale, veicolo_id, assicuratore_id) VALUES (%s,%s,%s,%s,%s,%s,%s)", [
            (f'POL-{i:05}', 'Generali', '2024-01-01', '2025-01-01', 5000000.00, i, i) for i in range(1, 11)
        ]),
        "Documenti_Anagrafica": ("INSERT IGNORE INTO Documenti_Anagrafica (entita_tipo, entita_id, mongo_doc_id, tipo_documento) VALUES (%s,%s,%s,%s)", [
            ('automobilista', i, f'mongoID_anag_{i:012}', 'CI') for i in range(1, 11)
        ]),
        "Polizza_Documenti": ("INSERT IGNORE INTO Polizza_Documenti (polizza_id, mongo_doc_id, tipo_documento) VALUES (%s,%s,%s)", [
            (i, f'mongoID_pol_{i:013}', 'polizza_pdf') for i in range(1, 11)
        ])
    }

    for table_name, (query, data) in inserts.items():
        cursor.executemany(query, data)
        print(f"Inseriti record in {table_name}")

    conn.commit()
    cursor.close()
    conn.close()
    print("\nSetup completato con successo!")

if __name__ == "__main__":
    setup_database()
PYEOF

cat > backend/endpoint_5F_log_reg.py << 'PYEOF'
from flask import Flask, request, jsonify
import mysql.connector
import re
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

db_config = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client['FakeClaim']
    sinistri_col = mongo_db['Sinistro']
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas riuscita!")
except Exception as e:
    print(f"Errore critico connessione MongoDB: {e}")

def get_mysql_connection():
    return mysql.connector.connect(**db_config)

def valida_password(password):
    if len(password) < 8: return False, "La password deve essere lunga almeno 8 caratteri."
    if not re.search(r"[a-zA-Z]", password): return False, "La password deve contenere almeno una lettera."
    if not re.search(r"\d", password): return False, "La password deve contenere almeno un numero."
    return True, None

def valida_dati_utente(data):
    pattern_nomi = r"^[a-zA-Zàáâäãåèéêëìíîïòóôöùúûüç \s']+$"
    if not re.match(pattern_nomi, data.get('nome', '')): return False, "Il nome non è valido."
    if not re.match(pattern_nomi, data.get('cognome', '')): return False, "Il cognome non è valido."
    if not re.match(r'^[A-Z0-9]{16}$', data.get('cf', '').upper()): return False, "Il CF deve essere di 16 caratteri alfanumerici."
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data.get('email', '')): return False, "Formato email non valido."
    valida_psw, err_psw = valida_password(data.get('psw', ''))
    if not valida_psw: return False, err_psw
    return True, None

@app.route('/registrazione', methods=['POST'])
def registrazione():
    data = request.get_json()
    if not data: return jsonify({"error": "Nessun dato ricevuto"}), 400
    is_valid, error_message = valida_dati_utente(data)
    if not is_valid: return jsonify({"error": error_message}), 400
    conn = None
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        query = "INSERT INTO Automobilista (nome, cognome, cf, email, psw) VALUES (%s, %s, %s, %s, %s)"
        values = (data['nome'].strip().title(), data['cognome'].strip().title(),
                  data['cf'].strip().upper(), data['email'].strip().lower(), data['psw'])
        cursor.execute(query, values)
        conn.commit()
        return jsonify({"status": "success", "id": cursor.lastrowid}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Email o CF già registrati"}), 409
    finally:
        if conn: conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email_in, psw_in = data.get('email'), data.get('psw')
    if not email_in or not psw_in: return jsonify({"error": "Credenziali mancanti"}), 400
    conn = None
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        tabelle = ["Assicuratore", "Automobilista", "Perito"]
        for tabella in tabelle:
            cursor.execute(f"SELECT id, nome, cognome, email FROM {tabella} WHERE email = %s AND psw = %s", (email_in, psw_in))
            user_found = cursor.fetchone()
            if user_found:
                user_found['ruolo'] = tabella.lower()
                return jsonify({"status": "success", "user": user_found}), 200
        return jsonify({"error": "Credenziali non valide"}), 401
    finally:
        if conn: conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000, debug=True)
PYEOF

cat > backend/endpoint_5F_Assicurazione.py << 'PYEOF'
from flask import Flask, request, jsonify
import mysql.connector
import re
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client['FakeClaim']
    sinistri_col = mongo_db['Sinistro']
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas (FakeClaim) riuscita!")
except Exception as e:
    print(f"Errore critico connessione MongoDB: {e}")

def get_mysql_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

@app.route('/sinistri', defaults={'id_sinistro': None}, methods=['GET'])
@app.route('/sinistri/<id_sinistro>', methods=['GET'])
def ottieni_sinistri(id_sinistro):
    try:
        if id_sinistro:
            if not ObjectId.is_valid(id_sinistro):
                return jsonify({"error": "Formato ID non valido"}), 400
            sinistro = sinistri_col.find_one({"_id": ObjectId(id_sinistro)})
            if not sinistro:
                return jsonify({"error": "Sinistro non trovato"}), 404
            sinistro['_id'] = str(sinistro['_id'])
            return jsonify(sinistro), 200
        else:
            cursor = sinistri_col.find()
            lista = []
            for s in cursor:
                s['_id'] = str(s['_id'])
                lista.append(s)
            return jsonify({"count": len(lista), "data": lista}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sinistro/<id_sinistro>/perito', methods=['PUT'])
def assegna_perito(id_sinistro):
    try:
        data = request.get_json()
        id_perito = data.get('id_perito')
        if id_perito is None: return jsonify({"error": "id_perito mancante"}), 400
        result = sinistri_col.update_one(
            {"_id": ObjectId(id_sinistro)},
            {"$set": {"perito_id": id_perito, "stato": "assegnato_a_perito", "data_assegnazione": datetime.now()}}
        )
        if result.matched_count > 0:
            return jsonify({"status": "success", "message": "Perito assegnato"}), 200
        return jsonify({"error": "Sinistro non trovato"}), 404
    except Exception as e:
        return jsonify({"error": "ID malformato o errore server"}), 400

@app.route('/sinistro/<id>', methods=['PUT'])
def aggiorna_sinistro(id):
    data = request.json
    campi_ammessi = ['stato', 'descrizione', 'perizia_id', 'officina_id', 'documenti_allegati']
    update_query = {k: v for k, v in data.items() if k in campi_ammessi}
    if not update_query: return jsonify({"error": "Dati non validi"}), 400
    try:
        if not ObjectId.is_valid(id): return jsonify({"error": "ID malformato"}), 400
        result = sinistri_col.update_one({"_id": ObjectId(id)}, {"$set": update_query})
        if result.matched_count == 0: return jsonify({"error": "Sinistro non trovato"}), 404
        return jsonify({"messaggio": "Aggiornato su Atlas", "campi": list(update_query.keys())}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/veicoli-utente/<int:user_id>', methods=['GET'])
def get_veicoli_utente(user_id):
    conn = None
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM Veicolo WHERE automobilista_id = %s"
        cursor.execute(query, (user_id,))
        veicoli = cursor.fetchall()
        return jsonify(veicoli), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
PYEOF

cat > backend/endpoint_5F_Sinistri_User.py << 'PYEOF'
from flask import Flask, request, jsonify
from datetime import datetime, UTC
import mysql.connector
import pymongo
from bson.objectid import ObjectId
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

def get_db_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client["FakeClaim"]
    sinistri_col = mongo_db["Sinistro"]
    soccorso_col = mongo_db["Soccorso"]
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas riuscita!")
except Exception as e:
    print(f"Errore connessione MongoDB: {e}")

@app.route('/sinistro', methods=['POST'])
def apri_sinistro():
    data = request.json
    required = ['automobilista_id', 'targa', 'data_evento', 'descrizione']
    if not all(k in data for k in required):
        return jsonify({"error": "Campi obbligatori mancanti"}), 400
    try:
        nuovo_sinistro = {
            "automobilista_id": data['automobilista_id'],
            "targa": data['targa'],
            "data_evento": data['data_evento'],
            "descrizione": data['descrizione'],
            "stato": "APERTO",
            "data_inserimento": datetime.now(UTC),
            "immagini": []
        }
        result = sinistri_col.insert_one(nuovo_sinistro)
        return jsonify({"status": "success", "mongo_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sinistri', methods=['GET'])
def get_tutti_i_sinistri():
    try:
        sinistri = list(sinistri_col.find())
        for s in sinistri:
            s['_id'] = str(s['_id'])
        return jsonify(sinistri), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sinistro/ultimo/immagini', methods=['POST'])
def aggiungi_immagine_ultimo():
    data = request.json
    if not data or 'immagine_base64' not in data:
        return jsonify({"error": "Dati immagine mancanti"}), 400
    try:
        ultimo = sinistri_col.find_one(sort=[("data_inserimento", -1)])
        if not ultimo:
            return jsonify({"error": "Nessun sinistro trovato"}), 404
        sinistri_col.update_one(
            {"_id": ultimo["_id"]},
            {"$push": {"immagini": data['immagine_base64']}}
        )
        return jsonify({"status": "success", "id_usato": str(ultimo["_id"])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/soccorso', methods=['POST'])
def crea_richiesta_soccorso():
    data = request.json
    targa = data.get('targa')
    if not targa:
        return jsonify({"error": "Targa obbligatoria"}), 400
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM Veicolo WHERE targa = %s", (targa,))
        veicolo = cursor.fetchone()
        if not veicolo:
            return jsonify({"error": "Veicolo non trovato in MySQL"}), 404
        nuovo_soccorso = {
            "veicolo_id": veicolo['id'],
            "targa": targa,
            "posizione": {"lat": data.get('lat'), "lon": data.get('lon')},
            "stato": "Richiesto",
            "data_richiesta": datetime.now(UTC)
        }
        res = soccorso_col.insert_one(nuovo_soccorso)
        sql = "INSERT INTO Documenti_Anagrafica (entita_tipo, entita_id, mongo_doc_id, tipo_documento) VALUES ('soccorso', %s, %s, 'intervento')"
        cursor.execute(sql, (veicolo['id'], str(res.inserted_id)))
        conn.commit()
        return jsonify({"intervento_id": str(res.inserted_id), "stato": "In attesa"}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/veicoli-utente/<int:user_id>', methods=['GET'])
def get_veicoli_utente(user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT
                v.id, v.targa, v.marca, v.modello, v.anno_immatricolazione,
                a.nome AS nome_proprietario, a.cognome AS cognome_proprietario,
                az.ragione_sociale AS azienda_proprietaria
            FROM Veicolo v
            LEFT JOIN Automobilista a ON v.automobilista_id = a.id
            LEFT JOIN Azienda az ON v.azienda_id = az.id
            WHERE v.automobilista_id = %s OR v.azienda_id = %s
        """
        cursor.execute(query, (user_id, user_id))
        veicoli = cursor.fetchall()
        return jsonify(veicoli), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/veicoli', methods=['POST'])
def add_veicolo():
    data = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO Veicolo
            (targa, n_telaio, marca, modello, anno_immatricolazione, automobilista_id, azienda_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (data.get('targa'), data.get('n_telaio'), data.get('marca'),
                  data.get('modello'), data.get('anno_immatricolazione'),
                  data.get('automobilista_id'), data.get('azienda_id'))
        cursor.execute(query, values)
        conn.commit()
        return jsonify({"status": "success", "id": cursor.lastrowid}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": "Errore DB", "details": str(err)}), 400
    finally:
        if conn: conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=7000)
PYEOF

cat > backend/endpoint_5F_Periti.py << 'PYEOF'
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import mysql.connector
from bson import ObjectId
from datetime import datetime

app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

def get_mysql():
    return mysql.connector.connect(**MYSQL_CONFIG)

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client["FakeClaim"]
    col_pratiche = mongo_db["Pratica"]
    col_perizie = mongo_db["Perizia"]
    col_sinistri = mongo_db["Sinistro"]
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas (FakeClaim) riuscita!")
except Exception as e:
    print(f"Errore connessione MongoDB: {e}")

@app.route("/sinistro/<sinistro_id>/perito/<perito_id>/pratica", methods=["GET"])
def get_pratica(sinistro_id, perito_id):
    try:
        query = {"sinistro_id": ObjectId(sinistro_id), "perito_id": perito_id}
        pratica = col_perizie.find_one(query)
        if not pratica:
            return jsonify({"error": "Pratica non trovata nel database Atlas"}), 404
        pratica["_id"] = str(pratica["_id"])
        pratica["sinistro_id"] = str(pratica["sinistro_id"])
        return jsonify(pratica), 200
    except Exception as e:
        return jsonify({"error": "ID sinistro malformato o errore server", "details": str(e)}), 400

@app.route("/sinistro/<sinistro_id>/perito/<perito_id>/pratica", methods=["PUT"])
def update_pratica(sinistro_id, perito_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dati mancanti"}), 400
    query = {"sinistro_id": sinistro_id, "perito_id": perito_id}
    update_data = {
        "$set": {
            "titolo": data.get("titolo"),
            "descrizione": data.get("descrizione"),
            "stato": data.get("stato", "In lavorazione"),
            "note_perito": data.get("note_perito"),
            "data_aggiornamento": datetime.utcnow()
        }
    }
    col_pratiche.update_one(query, update_data, upsert=True)
    return jsonify({"status": "success"}), 200

@app.route('/sinistro/<id_sinistro>/perito/<id_perito>/pratica', methods=['POST'])
def crea_pratica_completa(id_sinistro, id_perito):
    data = request.get_json()
    conn = get_mysql()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM Perito WHERE id = %s", (id_perito,))
    perito_esiste = cursor.fetchone()
    cursor.close()
    conn.close()
    if not perito_esiste:
        return jsonify({"error": "Perito non trovato"}), 404
    try:
        s_id = ObjectId(id_sinistro)
    except:
        return jsonify({"error": "ID sinistro non valido"}), 400
    documenti = data.get("documenti", [])
    perizia_doc = {
        "sinistro_id": s_id,
        "perito_id": id_perito,
        "data_perizia": data.get("data_perizia"),
        "ora_perizia": data.get("ora_perizia"),
        "note_tecniche": data.get("note_tecniche"),
        "documenti": documenti,
        "stato": "aperta",
        "data_inserimento": datetime.utcnow()
    }
    result = col_perizie.insert_one(perizia_doc)
    perizia_id = result.inserted_id
    col_sinistri.update_one(
        {"_id": s_id},
        {"$set": {"stato": "in_perizia", "perito_id": id_perito, "perizia_id": str(perizia_id), "data_aggiornamento": datetime.utcnow()}}
    )
    return jsonify({"status": "Pratica creata", "id_perizia": str(perizia_id), "documenti_caricati": len(documenti)}), 201

@app.route('/sinistro/<id_sinistro>/perito/<id_perito>/pratica/<id_perizia>/rimborso', methods=['POST'])
def registra_rimborso(id_sinistro, id_perito, id_perizia):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Body JSON mancante"}), 400
    try:
        s_id = ObjectId(id_sinistro)
        p_id = ObjectId(id_perizia)
    except:
        return jsonify({"error": "Formato ID non valido"}), 400
    res = col_perizie.update_one(
        {"_id": p_id},
        {"$set": {"stima_danno": data.get("stima_danno"), "esito": data.get("esito"), "stato": "rimborso_inserito", "data_aggiornamento": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        return jsonify({"error": "Perizia non trovata"}), 404
    col_sinistri.update_one({"_id": s_id}, {"$set": {"stato": "rimborso_proposto", "data_aggiornamento": datetime.utcnow()}})
    return jsonify({"status": "Rimborso salvato"}), 200

@app.route('/sinistro/<id_sinistro>/perito/<id_perito>/pratica/<id_perizia>/intervento', methods=['POST'])
def assegna_intervento(id_sinistro, id_perito, id_perizia):
    data = request.get_json()
    id_officina = data.get("id_officina")
    if not id_officina:
        return jsonify({"error": "ID officina mancante"}), 400
    conn = get_mysql()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM Officina WHERE id = %s", (id_officina,))
    officina_esiste = cursor.fetchone()
    cursor.close()
    conn.close()
    if not officina_esiste:
        return jsonify({"error": "Officina non trovata"}), 404
    try:
        s_id = ObjectId(id_sinistro)
        p_id = ObjectId(id_perizia)
    except:
        return jsonify({"error": "Formato ID non valido"}), 400
    col_sinistri.update_one(
        {"_id": s_id},
        {"$set": {"id_officina": id_officina, "stato": "in_riparazione", "data_inizio_lavori": data.get("data_inizio_lavori"), "data_aggiornamento": datetime.utcnow()}}
    )
    col_perizie.update_one({"_id": p_id}, {"$set": {"stato": "inviata_officina", "id_officina": id_officina}})
    return jsonify({"status": "Successo", "nuovo_stato": "in_riparazione"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
PYEOF

cat > backend/endpoint_5F_Polizze.py << 'PYEOF'
from flask import Flask, request, jsonify
import mysql.connector
import re
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client['FakeClaim']
    sinistri_col = mongo_db['Sinistro']
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas (FakeClaim) riuscita!")
except Exception as e:
    print(f"Errore critico connessione MongoDB: {e}")

def get_mysql_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

@app.route('/polizze', methods=['POST'])
def crea_polizza():
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    query = """
        INSERT INTO Polizza (n_polizza, compagnia_assicurativa, data_inizio,
        data_scadenza, massimale, tipo_copertura, veicolo_id, assicuratore_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (data['n_polizza'], data.get('compagnia_assicurativa'), data['data_inizio'],
              data['data_scadenza'], data.get('massimale'), data.get('tipo_copertura', 'RCA'),
              data['veicolo_id'], data['assicuratore_id'])
    try:
        cursor.execute(query, values)
        conn.commit()
        return jsonify({"message": "Polizza inserita!", "id": cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/polizze', methods=['GET'])
def leggi_polizze():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Polizza")
    risultati = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(risultati), 200

@app.route('/polizze/<int:id>', methods=['PUT'])
def modifica_polizza(id):
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    query = "UPDATE Polizza SET n_polizza=%s, data_scadenza=%s WHERE id=%s"
    cursor.execute(query, (data['n_polizza'], data['data_scadenza'], id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Polizza aggiornata"}), 200

@app.route('/polizze/<int:id>', methods=['DELETE'])
def elimina_polizza(id):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Polizza WHERE id=%s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Polizza eliminata"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=True)
PYEOF

cat > backend/endpoint_5F_Veicoli.py << 'PYEOF'
from flask import Flask, request, jsonify
from datetime import datetime, UTC
import mysql.connector
import pymongo
from bson.objectid import ObjectId
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "pythonuser",
    "password": "password123",
    "database": "gestione_assicurazioni"
}

def get_db_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

MONGO_URI = "mongodb+srv://dbFakeClaim:xxx123%23%23@cluster0.zgw1jft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client["FakeClaim"]
    sinistri_col = mongo_db["Sinistro"]
    soccorso_col = mongo_db["Soccorso"]
    mongo_client.admin.command('ping')
    print("Connessione a MongoDB Atlas riuscita!")
except Exception as e:
    print(f"Errore connessione MongoDB: {e}")

@app.route('/veicoli', methods=['GET'])
@app.route('/veicoli/<int:id>', methods=['GET'])
def get_veicoli(id=None):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        if id:
            cursor.execute("SELECT * FROM Veicolo WHERE id = %s", (id,))
            veicolo = cursor.fetchone()
            if not veicolo: return jsonify({"error": "Veicolo non trovato"}), 404
            return jsonify(veicolo), 200
        else:
            cursor.execute("SELECT * FROM Veicolo")
            return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)
PYEOF

log "File backend scritti."

# ==============================================================
# STEP 3 — Scrivi i file .devcontainer
# ==============================================================
log "[3/6] Scrittura configurazione devcontainer..."

cat > .devcontainer/devcontainer.json << 'EOF'
{
  "name": "SafeClaim Full Stack",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/mysql:1": {}
  },
  "postCreateCommand": "bash .devcontainer/setup.sh",
  "postStartCommand": "bash .devcontainer/start_backend.sh",
  "forwardPorts": [4200, 5000, 6000, 7000, 8000, 9000, 10000],
  "portsAttributes": {
    "4200":  { "label": "Angular Dev Server", "onAutoForward": "openBrowser" },
    "5000":  { "label": "API Assicurazioni" },
    "6000":  { "label": "API Login / Registrazione" },
    "7000":  { "label": "API Sinistri Utente" },
    "8000":  { "label": "API Periti" },
    "9000":  { "label": "API Polizze" },
    "10000": { "label": "API Veicoli" }
  }
}
EOF

cat > .devcontainer/setup.sh << 'EOF'
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
EOF

cat > .devcontainer/start_backend.sh << 'EOF'
#!/bin/bash
echo "--- Avvio MySQL ---"
sudo service mysql start

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
echo "Log: /tmp/api_*.log"
EOF

chmod +x .devcontainer/setup.sh .devcontainer/start_backend.sh
log "File devcontainer scritti."

# ==============================================================
# STEP 4 — Installa dipendenze Python
# ==============================================================
log "[4/6] Installazione dipendenze Python..."
pip install flask flask-cors mysql-connector-python "pymongo[srv]"

# ==============================================================
# STEP 5 — Setup MySQL
# ==============================================================
log "[5/6] Configurazione MySQL..."
sudo service mysql start || warn "MySQL potrebbe essere già avviato."
sleep 2
sudo mysql -e "CREATE USER IF NOT EXISTS 'pythonuser'@'localhost' IDENTIFIED BY 'password123';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'pythonuser'@'localhost' WITH GRANT OPTION;" 2>/dev/null || true
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

log "Creazione database e inserimento dati iniziali..."
cd backend
python db_locale.py
cd ..

# ==============================================================
# STEP 6 — Avvio tutti i server Flask
# ==============================================================
log "[6/6] Avvio server Flask..."
pkill -f "python endpoint_5F" 2>/dev/null || true
sleep 1

cd backend
nohup python endpoint_5F_log_reg.py       > /tmp/api_log_reg.log       2>&1 &
nohup python endpoint_5F_Assicurazione.py > /tmp/api_assicurazione.log 2>&1 &
nohup python endpoint_5F_Sinistri_User.py > /tmp/api_sinistri.log      2>&1 &
nohup python endpoint_5F_Periti.py        > /tmp/api_periti.log        2>&1 &
nohup python endpoint_5F_Polizze.py       > /tmp/api_polizze.log       2>&1 &
nohup python endpoint_5F_Veicoli.py       > /tmp/api_veicoli.log       2>&1 &
cd ..

sleep 2
echo ""
echo "============================================"
echo " SafeClaim - Setup completato!"
echo "============================================"
echo " Backend attivo su:"
echo "   :5000  -> Assicurazioni"
echo "   :6000  -> Login / Registrazione"
echo "   :7000  -> Sinistri Utente"
echo "   :8000  -> Periti"
echo "   :9000  -> Polizze"
echo "   :10000 -> Veicoli"
echo ""
echo " Ora lancia Angular con: ng serve"
echo " Log backend: /tmp/api_*.log"
echo "============================================"
