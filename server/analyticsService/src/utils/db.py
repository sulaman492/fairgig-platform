import asyncpg
import os

"""
DB Utility - Manages database connections
Similar to: const pool = new Pool({ connectionString: DATABASE_URL })
"""

async def get_db():
    """Get database connection - like pool.connect()"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

async def query(sql: str, *params):
    """Execute SQL query - like db.query(sql, params)"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        if params:
            result = await conn.fetch(sql, *params)
        else:
            result = await conn.fetch(sql)
        return result
    finally:
        await conn.close()

async def query_row(sql: str, *params):
    """Get single row - like db.queryOne(sql, params)"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        if params:
            result = await conn.fetchrow(sql, *params)
        else:
            result = await conn.fetchrow(sql)
        return result
    finally:
        await conn.close()