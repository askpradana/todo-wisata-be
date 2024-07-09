import sqlite3 from "sqlite3";
import config from "./config.js";

const db = new sqlite3.Database(config.dbPath, (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log("Connected to the database.");
});

// users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT
)`);

// task table
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`);

export default db;
