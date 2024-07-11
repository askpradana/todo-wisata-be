import express from "express";
import { verifyToken } from "../middleware/verifyjwt.js";
import { db, getColorHex, formatReminder } from "../core/database.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
	const userId = req.user.userId;
	const userName = req.user.username;

	db.all("SELECT * FROM todos WHERE user_id = ?", [userId], (err, todos) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		const formattedTodos = todos.map((todo) => ({
			...todo,
			colorHex: getColorHex(todo.color),
			reminder: formatReminder(todo.reminder),
		}));

		res.json({
			username: userName,
			todoList: formattedTodos,
		});
	});
});

router.post("/", verifyToken, (req, res) => {
	const userId = req.user.userId;
	const { title, description, color, reminder } = req.body;

	if (!title) {
		return res.status(400).json({ error: "Title is required for the todo" });
	}

	const validColors = ["red", "purple", "blue", "green", "yellow", "default"];
	const todoColor = validColors.includes(color) ? color : "default";

	const query = `INSERT INTO todos (user_id, title, description, completed, color, reminder) VALUES (?, ?, ?, ?, ?, ?)`;

	db.run(
		query,
		[userId, title, description || null, false, todoColor, reminder || null],
		function (err) {
			if (err) {
				return res.status(500).json({ error: "Failed to create new todo" });
			}

			db.get("SELECT * FROM todos WHERE id = ?", [this.lastID], (err, todo) => {
				if (err) {
					return res
						.status(500)
						.json({ error: "Failed to retrieve the new todo" });
				}

				const formattedTodo = {
					...todo,
					colorHex: getColorHex(todo.color),
					reminder: formatReminder(todo.reminder),
				};

				res.status(201).json(formattedTodo);
			});
		}
	);
});

router.patch("/:id", verifyToken, (req, res) => {
	const userId = req.user.userId;
	const todoId = req.params.id;
	const { completed, title, description, color, reminder } = req.body;

	let updateFields = [];
	let updateValues = [];

	if (completed !== undefined) {
		updateFields.push("completed = ?");
		updateValues.push(completed ? 1 : 0);
	}
	if (title !== undefined) {
		updateFields.push("title = ?");
		updateValues.push(title);
	}
	if (description !== undefined) {
		updateFields.push("description = ?");
		updateValues.push(description);
	}
	if (color !== undefined) {
		const validColors = ["red", "purple", "blue", "green", "yellow", "default"];
		updateFields.push("color = ?");
		updateValues.push(validColors.includes(color) ? color : "default");
	}
	if (reminder !== undefined) {
		updateFields.push("reminder = ?");
		updateValues.push(reminder);
	}

	if (updateFields.length === 0) {
		return res.status(400).json({ error: "No valid fields to update" });
	}

	const query = `UPDATE todos SET ${updateFields.join(
		", "
	)} WHERE id = ? AND user_id = ?`;
	updateValues.push(todoId, userId);

	db.run(query, updateValues, function (err) {
		if (err) {
			return res.status(500).json({ error: "Failed to update todo" });
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

			const formattedTodo = {
				...todo,
				colorHex: getColorHex(todo.color),
				reminder: formatReminder(todo.reminder),
			};

			res.json(formattedTodo);
		});
	});
});

app.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const userId = req.user.id;

	try {
		const result = await db.run(
			"DELETE FROM todos WHERE id = ? AND user_id = ?",
			[id, userId]
		);

		if (result.changes === 0) {
			return res.status(404).json({ message: "Task not found" });
		}

		res.json({ message: "Task deleted" });
	} catch (error) {
		console.error("Error deleting todo:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/myday", verifyToken, (req, res) => {
	const userId = req.user.userId;

	const today = new Date();
	const monthDay = `${(today.getMonth() + 1)
		.toString()
		.padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

	const query = `
	  SELECT * FROM todos 
	  WHERE user_id = ? 
	  AND reminder IS NOT NULL
	  AND completed = 0
	  AND (
		(strftime('%m-%d', reminder) = ?) OR
		DATE(reminder) < DATE('now')
	  )
	  ORDER BY reminder ASC
	`;

	db.all(query, [userId, monthDay], (err, todos) => {
		if (err) {
			return res.status(500).json({ error: "Internal server error" });
		}

		const formattedTodos = todos.map((todo) => ({
			...todo,
			colorHex: getColorHex(todo.color),
			reminder: formatReminder(todo.reminder),
		}));

		res.json(formattedTodos);
	});
});

export default router;
