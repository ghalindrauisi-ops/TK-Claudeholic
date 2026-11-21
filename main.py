from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from datetime import datetime
import os

app = Flask(__name__, static_folder=".", static_url_path="")
DB_PATH = "kantinui.db"

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

if __name__ == "__main__":
    app.run(debug=True)