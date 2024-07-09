import express from "express";
import { verifyToken } from "../middleware/verifyjwt.js";
import db from "../core/database.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
	const userId = req.user.userId;

	db.all("SELECT * FROM todos WHERE user_id = ?", [userId], (err, todos) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		res.json(todos);
	});
});

router.post("/", verifyToken, (req, res) => {
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

router.patch("/:id", verifyToken, (req, res) => {
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

export default router;