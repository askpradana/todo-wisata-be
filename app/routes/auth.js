import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../core/database.js";
import config from "../core/config.js";

const router = express.Router();

router.post("/login", (req, res) => {
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
				config.jwtSecret,
				{ expiresIn: "1h" }
			);

			res.json({ token });
		});
	});
});

router.post("/register", (req, res) => {
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

export default router;
