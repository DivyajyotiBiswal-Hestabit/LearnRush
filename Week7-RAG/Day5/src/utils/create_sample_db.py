import os
import sqlite3


def create_sample_database(db_path: str = "src/data/sql/company.db"):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop old tables if they exist
    cursor.execute("DROP TABLE IF EXISTS artists;")
    cursor.execute("DROP TABLE IF EXISTS sales;")

    # Artists table
    cursor.execute("""
        CREATE TABLE artists (
            artist_id INTEGER PRIMARY KEY,
            artist_name TEXT NOT NULL,
            genre TEXT,
            country TEXT
        );
    """)

    # Sales table
    cursor.execute("""
        CREATE TABLE sales (
            sale_id INTEGER PRIMARY KEY,
            artist_id INTEGER NOT NULL,
            sale_year INTEGER NOT NULL,
            album_name TEXT NOT NULL,
            units_sold INTEGER NOT NULL,
            revenue REAL NOT NULL,
            FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
        );
    """)

    artists_data = [
        (1, "Taylor Swift", "Pop", "USA"),
        (2, "Ed Sheeran", "Pop", "UK"),
        (3, "Arijit Singh", "Bollywood", "India"),
        (4, "Bad Bunny", "Reggaeton", "Puerto Rico"),
        (5, "Drake", "Hip-Hop", "Canada"),
    ]

    sales_data = [
        (1, 1, 2022, "Midnights", 1200000, 24000000.0),
        (2, 1, 2023, "1989 Taylor's Version", 1800000, 36000000.0),
        (3, 2, 2022, "Subtract", 700000, 14000000.0),
        (4, 2, 2023, "Autumn Variations", 600000, 12000000.0),
        (5, 3, 2022, "Soulful Nights", 500000, 8000000.0),
        (6, 3, 2023, "Melody India", 950000, 15200000.0),
        (7, 4, 2022, "Un Verano", 1100000, 19800000.0),
        (8, 4, 2023, "Nadie Sabe", 1300000, 24700000.0),
        (9, 5, 2022, "Her Loss", 900000, 17100000.0),
        (10, 5, 2023, "For All The Dogs", 1250000, 23750000.0),
    ]

    cursor.executemany(
        "INSERT INTO artists (artist_id, artist_name, genre, country) VALUES (?, ?, ?, ?);",
        artists_data
    )

    cursor.executemany(
        """
        INSERT INTO sales (sale_id, artist_id, sale_year, album_name, units_sold, revenue)
        VALUES (?, ?, ?, ?, ?, ?);
        """,
        sales_data
    )

    conn.commit()
    conn.close()

    print(f"Sample database created at: {db_path}")


if __name__ == "__main__":
    create_sample_database()