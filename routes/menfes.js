const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/token");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
    const { message, visibility, targetUsername } = req.body;
    const userId = req.userId;
    const created_at = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
    });

    console.log("DEBUG: User ID is", userId);

    try {
        let targetUserId = null;

        if (visibility === "private") {
            db.query("SELECT id FROM users WHERE username = ?", [targetUsername], (err, rows) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Database query error" });
                }

                if (!rows.length) {
                    return res.status(404).json({ error: "Subject not found!" });
                }
                targetUserId = rows[0].id;

                db.query(
                    "INSERT INTO menfes (user_id, message, visibility, created_at, target_user_id) VALUES (?, ?, ?, ?, ?)",
                    [userId, message, visibility, created_at, targetUserId],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: "Failed to send private menfes" });
                        }

                        res.status(201).json({ message: "Menfes sent!" });
                    }
                );
            });
        } else {
            db.query(
                "INSERT INTO menfes (user_id, message, created_at, visibility) VALUES (?, ?, ?, ?)",
                [userId, message, created_at, visibility],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "Failed to send menfes" });
                    }

                    res.status(201).json({ message: "Menfes sent!" });
                }
            );
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
});

router.get("/public", (req, res) => {
    db.query(
        "SELECT users.username, menfes.message FROM menfes LEFT JOIN users ON menfes.user_id = users.id WHERE menfes.visibility = 'public'",
        (err, menfes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred" });
            }
            res.status(200).json(menfes);
        }
    );
});

router.get("/private", verifyToken, (req, res) => {
    const userId = req.userId;
    db.query(
        "SELECT users.id, users.username, menfes.message, menfes.created_at, target_user_id FROM menfes LEFT JOIN users ON menfes.user_id = users.id WHERE menfes.visibility = 'private' AND menfes.target_user_id = ?",
        [userId],
        (err, menfes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred" });
            }
            res.status(200).json(menfes);
        }
    );
});

router.delete("/:id", verifyToken, (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    db.query(
        "DELETE FROM menfes WHERE id = ? AND user_id = ?",
        [id, userId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Menfes not found!" });
            }

            res.status(200).json({ message: "Menfes successfully deleted!" });
        }
    );
});

module.exports = router;