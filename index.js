// server.js
import express from "express";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database("./Database.db", (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log("Connected to the users database.");
});

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

// Secret key for JWT
const JWT_SECRET = "tabasco-aerospace-worrisome-lesser";

// Login route
app.post("/login", (req, res) => {
	const { username, password } = req.body;

	// Find user in database
	db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		if (!user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Compare password
		bcrypt.compare(password, user.password, (err, result) => {
			if (err) {
				return res.status(500).json({ error: "Internal server error" });
			}

			if (!result) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			// Generate JWT
			const token = jwt.sign(
				{ userId: user.id, username: user.username },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			res.json({ token });
		});
	});
});

// Register route
app.post("/register", (req, res) => {
	const { username, password } = req.body;

	bcrypt.hash(password, 10, (err, hash) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		db.run(
			"INSERT INTO users (username, password) VALUES (?, ?)",
			[username, hash],
			function (err) {
				if (err) {
					return res.status(500).json({ error: "Username already exists" });
				}

				res.status(201).json({ message: "User created successfully" });
			}
		);
	});
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
