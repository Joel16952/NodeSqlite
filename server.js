const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "artists.db");

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const allowedTables = {
  artists: { name: "artists", orderBy: "id DESC" },
  albums: { name: "albums", orderBy: "id DESC" },
  songs: { name: "songs", orderBy: "id DESC" },
  artist_albums: { name: "artist_albums", orderBy: "artist_id DESC, album_id DESC" },
  album_songs: { name: "album_songs", orderBy: "album_id DESC, song_id DESC" },
};

function sendDbError(res, error) {
  res.status(500).type("text").send(`Error: ${error.message}`);
}

// Creem les taules i ens assegurem que hi hagi dades inicials.
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS artist_albums (
      artist_id INTEGER NOT NULL,
      album_id INTEGER NOT NULL,
      PRIMARY KEY (artist_id, album_id),
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS album_songs (
      album_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      PRIMARY KEY (album_id, song_id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    )
  `);

  db.get("SELECT id FROM artists WHERE name = ?", ["Txarango"], (error, row) => {
    if (error) {
      console.log("Error comprovant dades inicials:", error.message);
      return;
    }

    if (!row) {
      db.run("INSERT INTO artists (name) VALUES (?)", ["Txarango"]);
    }
  });

  db.get("SELECT id FROM artists WHERE name = ?", ["Oques Grasses"], (error, row) => {
    if (error) {
      console.log("Error comprovant dades inicials:", error.message);
      return;
    }

    if (!row) {
      db.run("INSERT INTO artists (name) VALUES (?)", ["Oques Grasses"]);
    }
  });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post("/api/AddArtist",  (req, res) => {
  const name = req.body.data;
  db.run("INSERT INTO artists (name) VALUES (?)", [name], (error) => {
    if (error) {
      sendDbError(res, error);
      return;
    }
    res.status(201).type("text").send(`Artista desat: ${name}`);
  });
});

app.post("/api/artists",  (req, res) => {
  const table = req.body.data;
  const tableInfo = allowedTables[table];
  if (!tableInfo) {
    res.status(400).json({ error: "Taula no permesa" });
    return;
  }

  db.all(`SELECT * FROM ${tableInfo.name} ORDER BY ${tableInfo.orderBy}`, (err, rows) => {
    if (err){
      return res.status(500).json({ error: err.message });
    }
    console.log(rows);
    res.json({ result: rows });
  });
});

app.post("/api/AddAlbum", (req, res) => {
  const title = req.body.title;
  const artistId = req.body.artist_id;

  db.run("INSERT INTO albums (title) VALUES (?)", [title], function (error) {
    if (error) {
      sendDbError(res, error);
      return;
    }

    const albumId = this.lastID;
    db.run(
      "INSERT INTO artist_albums (artist_id, album_id) VALUES (?, ?)",
      [artistId, albumId],
      (relationError) => {
        if (relationError) {
          sendDbError(res, relationError);
          return;
        }
        res.status(201).type("text").send(`Àlbum desat: ${title}`);
      }
    );
  });
});

app.post("/api/AddSong", (req, res) => {
  const name = req.body.name;
  const albumId = req.body.album_id;

  db.run("INSERT INTO songs (name) VALUES (?)", [name], function (error) {
    if (error) {
      sendDbError(res, error);
      return;
    }

    const songId = this.lastID;
    db.run(
      "INSERT INTO album_songs (album_id, song_id) VALUES (?, ?)",
      [albumId, songId],
      (relationError) => {
        if (relationError) {
          sendDbError(res, relationError);
          return;
        }
        res.status(201).type("text").send(`Cançó desada: ${name}`);
      }
    );
  });
});

app.post("/api/albums", (req, res) => {
  db.all(
    `
      SELECT
        albums.id,
        albums.title,
        GROUP_CONCAT(artists.name, ', ') AS artists
      FROM albums
      LEFT JOIN artist_albums ON artist_albums.album_id = albums.id
      LEFT JOIN artists ON artists.id = artist_albums.artist_id
      GROUP BY albums.id
      ORDER BY albums.id DESC
    `,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ result: rows });
    }
  );
});

app.post("/api/songs", (req, res) => {
  db.all(
    `
      SELECT
        songs.id,
        songs.name,
        GROUP_CONCAT(albums.title, ', ') AS albums
      FROM songs
      LEFT JOIN album_songs ON album_songs.song_id = songs.id
      LEFT JOIN albums ON albums.id = album_songs.album_id
      GROUP BY songs.id
      ORDER BY songs.id DESC
    `,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ result: rows });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor a http://localhost:${PORT}`);
  console.log(`Base de dades SQLite: ${dbPath}`);
});
