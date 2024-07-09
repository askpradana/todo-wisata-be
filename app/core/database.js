import sqlite3 from "sqlite3";
import config from "./config.js";

export const db = new sqlite3.Database(config.dbPath, (err) => {
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
  color TEXT CHECK(color IN ('red', 'purple', 'blue', 'green', 'yellow', 'default') OR color IS NULL) DEFAULT 'default',
  FOREIGN KEY (user_id) REFERENCES users (id)
)`);

// function to get color hex
export function getColorHex(colorName) {
	const colorMap = {
		red: "#ff0000",
		purple: "#800080",
		blue: "#0000ff",
		green: "#008000",
		yellow: "#ffff00",
		default: "transparent",
	};
	return colorMap[colorName] || "transparent";
}
