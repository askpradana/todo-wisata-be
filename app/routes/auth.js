import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../core/database.js";
import config from "../core/config.js";

const router = express.Router();

router.post("/login", async (req, res) => {
	const { email, password } = req.body;

	try {
		const result = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		const user = result.rows[0];

		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ userId: user.id, username: user.username, email: user.email },
			config.jwtSecret,
			{ expiresIn: "1h" }
		);

		// Update the latest token in the database
		await db.query("UPDATE users SET latest_token = $1 WHERE id = $2", [
			token,
			user.id,
		]);

		console.log(
			`User ${user.id} logged in. Token: ${token.substring(0, 10)}...`
		);
		res.json({ token, userId: user.id });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/register", async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res
			.status(400)
			.json({ error: "Username, email, and password are required" });
	}

	try {
		const hash = await bcrypt.hash(password, 10);
		await db.query(
			"INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
			[username, email, hash]
		);
		res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		if (
			error.constraint === "users_username_key" ||
			error.constraint === "users_email_key"
		) {
			return res
				.status(409)
				.json({ error: "Username or email already exists" });
		}
		console.error("Registration error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
