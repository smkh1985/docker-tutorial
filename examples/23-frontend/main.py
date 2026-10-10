import os

import psycopg
from fastapi import FastAPI

app = FastAPI()
DATABASE_URL = os.environ["DATABASE_URL"]

with psycopg.connect(DATABASE_URL) as conn:
    conn.execute("CREATE TABLE IF NOT EXISTS products (name text)")


@app.get("/products")
def list_products():
    with psycopg.connect(DATABASE_URL) as conn:
        rows = conn.execute("SELECT name FROM products").fetchall()
    return [row[0] for row in rows]


@app.post("/products")
def add_product(name: str):
    with psycopg.connect(DATABASE_URL) as conn:
        conn.execute("INSERT INTO products (name) VALUES (%s)", (name,))
    return {"added": name}
