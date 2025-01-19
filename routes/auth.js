const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
require('../middleware/token');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'qwerty12345';

const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, email, password, birthday, fullname } = req.body;

    if (!username || !email || !password || !birthday || !fullname) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const joinDate = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

        const checkUser = "SELECT * FROM users WHERE username = ? OR email = ?";
        db.query(checkUser, [username, email], (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Error checking username/email!", error: err.message });
            }

            if (results.length > 0) {
                const existingField = results[0].username === username ? "Username" : "Email";
                return res.status(400).json({ message: `${existingField} already exists!` });
            }

            const sql = "INSERT INTO users (username, email, password, join_date, birth_day, fullname) VALUES (?, ?, ?, ?, ?, ?)";
            db.query(sql, [username, email, hashedPassword, joinDate, birthday, fullname], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error registering user!", error: err.message });
                }

                res.status(201).json({ message: "User registered successfully!" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "An error occurred!", error: error.message });
    }
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill email and password' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'Email not found' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error verifying password' });
            }
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

            console.log("DEBUG: Token:", token);

            res.json({
                message: 'Login successful',
                userId: user.id,
                token,
            });
        });
    });
});

module.exports = router;