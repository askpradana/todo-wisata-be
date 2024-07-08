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

// Database setup START
const db = new sqlite3.Database("./Database.db", (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log("Connected to the users database.");
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS todos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER,
	title TEXT NOT NULL,
	description TEXT,
	completed BOOLEAN DEFAULT 0,
	FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
// Database setup END

// Secret key for JWT
const JWT_SECRET = "tabasco-aerospace-worrisome-lesser";

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(400).json({ error: "Invalid token." });
	}
};

// routes START
app.get("/todos", verifyToken, (req, res) => {
	const userId = req.user.userId;

	db.all("SELECT * FROM todos WHERE user_id = ?", [userId], (err, todos) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		res.json(todos);
	});
});

app.post("/todos", verifyToken, (req, res) => {
	const userId = req.user.userId;
	const { title, description } = req.body;

	if (!title) {
		return res.status(400).json({ error: "Title is required for the todo" });
	}

	const query = `INSERT INTO todos (user_id, title, description, completed) VALUES (?, ?, ?, ?)`;

	db.run(query, [userId, title, description || null, false], function (err) {
		if (err) {
			return res.status(500).json({ error: "Failed to create new todo" });
		}

		db.get("SELECT * FROM todos WHERE id = ?", [this.lastID], (err, todo) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Failed to retrieve the new todo" });
			}

			res.status(201).json(todo);
		});
	});
});

// set todo as completed
app.patch("/todos/:id", verifyToken, (req, res) => {
	const userId = req.user.userId;
	const todoId = req.params.id;
	const { completed } = req.body;

	if (completed === undefined) {
		return res.status(400).json({ error: "Completed status is required" });
	}

	const query = `
	  UPDATE todos 
	  SET completed = ? 
	  WHERE id = ? AND user_id = ?
	`;

	db.run(query, [completed ? 1 : 0, todoId, userId], function (err) {
		if (err) {
			return res.status(500).json({ error: "Failed to update todo status" });
		}

		if (this.changes === 0) {
			return res
				.status(404)
				.json({ error: "Todo not found or not owned by user" });
		}

		db.get("SELECT * FROM todos WHERE id = ?", [todoId], (err, todo) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Failed to retrieve the updated todo" });
			}

			todo.completed = todo.completed === 1;

			res.json(todo);
		});
	});
});

app.post("/login", (req, res) => {
	const { email, password } = req.body;

	db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		bcrypt.compare(password, user.password, (err, result) => {
			if (err) {
				return res.status(500).json({ error: "Internal server error" });
			}

			if (!result) {
				return res.status(401).json({ error: "Invalid email or password" });
			}

			const token = jwt.sign(
				{ userId: user.id, username: user.username, email: user.email },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			res.json({ token });
		});
	});
});

app.post("/register", (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res
			.status(400)
			.json({ error: "Username, email, and password are required" });
	}

	bcrypt.hash(password, 10, (err, hash) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		db.run(
			"INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
			[username, email, hash],
			function (err) {
				if (err) {
					if (err.message.includes("UNIQUE constraint failed")) {
						return res
							.status(409)
							.json({ error: "Username or email already exists" });
					}
					return res.status(500).json({ error: "Internal server error" });
				}

				res.status(201).json({ message: "User created successfully" });
			}
		);
	});
});
// routes END

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
