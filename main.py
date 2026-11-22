from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from datetime import datetime
import os

app = Flask(__name__, static_folder=".", static_url_path="")
DB_PATH = "kantinui.db"

# Data mitra penjual terdaftar (sinkron dengan REGISTERED_SELLERS di script.js)
REGISTERED_SELLERS = [
    { "email": "kantinclaudeholic@gmail.com", "password": "claudeholic", "owner": "Kantin Claudeholic", "tid": 8, "role": "Mitra Utama Terdaftar FIB" },
    { "email": "warungbuimi.fib@gmail.com",   "password": "123",          "owner": "Bu Imi",             "tid": 8, "role": "Mitra Terdaftar FIB"  },
    { "email": "ayamgeprek.ft@gmail.com",     "password": "123",          "owner": "Mas Teknik",         "tid": 1, "role": "Mitra Terdaftar FT"   },
    { "email": "sotobetawi.feb@gmail.com",    "password": "123",          "owner": "Bang Jali",          "tid": 5, "role": "Mitra Terdaftar FEB"  },
    { "email": "takor.fisip@gmail.com",       "password": "123",          "owner": "Teh Rani Takor",     "tid": 10,"role": "Mitra Terdaftar FISIP"},
    { "email": "baksomipa.ui@gmail.com",      "password": "123",          "owner": "Cak Eko",            "tid": 15,"role": "Mitra Terdaftar FMIPA"},
    { "email": "mbakyanti.fib@gmail.com",     "password": "123",          "owner": "Mbak Yanti",         "tid": 19,"role": "Mitra Terdaftar FIB"  },
    { "email": "satekanhuk.fh@gmail.com",     "password": "123",          "owner": "Pak Haji Sate",      "tid": 13,"role": "Mitra Terdaftar FH"   },
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id_pesanan TEXT PRIMARY KEY,
            tid INTEGER,
            t_name TEXT,
            fac TEXT,
            nama TEXT,
            note TEXT,
            items TEXT,
            total INTEGER,
            status TEXT,
            waktu TEXT
        )
    ''')
    # Tabel sesi login mitra penjual
    c.execute('''
        CREATE TABLE IF NOT EXISTS seller_sessions (
            email TEXT PRIMARY KEY,
            owner TEXT,
            tid INTEGER,
            role TEXT,
            login_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route("/api/orders", methods=["GET"])
def get_orders():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM orders ORDER BY rowid DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json() or {}
    conn = sqlite3.connect(DB_PATH)
    now = datetime.now().strftime("%H:%M")
    conn.execute(
        "INSERT OR REPLACE INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("id_pesanan"),
            data.get("tid"),
            data.get("t_name"),
            data.get("fac"),
            data.get("nama"),
            data.get("note", ""),
            data.get("items"),
            data.get("total"),
            "Menunggu Konfirmasi",
            now
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "id_pesanan": data.get("id_pesanan")})

@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

@app.route("/claudeholic")
@app.route("/claudeholic.html")
def serve_claudeholic():
    return send_from_directory(".", "claudeholic.html")

if __name__ == "__main__":
    app.run(debug=True)