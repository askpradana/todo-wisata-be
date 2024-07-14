import pg from "pg";
import config from "./config.js";

const pool = new pg.Pool({
	user: config.dbUser,
	host: config.dbHost,
	database: config.dbName,
	password: config.dbPassword,
	port: config.port,
	ssl: true,
});

export const db = {
	query: (text, params) => pool.query(text, params),
};

// Initialize tables
const initDb = async () => {
	// users table
	await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      latest_token TEXT
    )
  `);

	// todos table
	await db.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      color TEXT CHECK(color IN ('red', 'purple', 'blue', 'green', 'yellow', 'default') OR color IS NULL) DEFAULT 'default',
      reminder TIMESTAMP
    )
  `);

	console.log("Database initialized");
};

initDb().catch(console.error);

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

export function formatReminder(reminder) {
	if (!reminder) return null;
	const date = new Date(reminder);
	return date.toISOString();
}
