CREATE TABLE IF NOT EXISTS song (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,

    -- metadata
    url TEXT NOT NULL UNIQUE,
    mbid TEXT UNIQUE,
    title TEXT NOT NULL,
    release_date TEXT,

    album_mbid TEXT, -- this is a "release group"
    album_title TEXT,
    cover_id TEXT,
    
    artist_mbid TEXT,
    artist_name TEXT,
    
    FOREIGN KEY (cover_id) REFERENCES cover(id)
);

CREATE TABLE IF NOT EXISTS submission (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    song_id TEXT NOT NULL,

    author_id TEXT NOT NULL,
    message TEXT NOT NULL,
    profile BLOB NOT NULL DEFAULT (jsonb('{}')),

    thread_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    
    FOREIGN KEY (thread_id) REFERENCES thread(id),
    FOREIGN KEY (song_id)   REFERENCES song(id)
);

CREATE TABLE IF NOT EXISTS thread (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    published INTEGER NOT NULL CHECK (published IN (0, 1)) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS avatar (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    content_type TEXT NOT NULL,
    data BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS cover (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    content_type TEXT NOT NULL,
    data BLOB NOT NULL
);