import sqlite3


class DBAgent:
    def run_query(self, db_path, query):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            cursor.execute(query)
            rows = cursor.fetchall()

            conn.close()
            return str(rows)

        except Exception as e:
            return str(e)