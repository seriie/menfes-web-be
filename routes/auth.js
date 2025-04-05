const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const queryDb = require("../helper/query");
const verifyApiKey = require('../middleware/api_key');
require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "qwerty12345";

router.post("/register", async (req, res) => {
  const { username, email, password, birthday, fullname } = req.body;

  if (!username || !email || !password || !birthday || !fullname) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const date = new Date().toISOString().slice(0, 10).replace("T", " ");
    const time = new Date().toLocaleTimeString();
    const joinDate = `${date} ${time}`;

    // Check if username or email already exists
    const checkUser = "SELECT * FROM users WHERE username = ? OR email = ?";
    const results = await queryDb(checkUser, [username, email]);

    if (results.length > 0) {
      const existingField = results[0].username === username ? "Username" : "Email";
      return res.status(400).json({ message: `${existingField} already exists!` });
    }

    // Insert user data into database
    const sql =
      "INSERT INTO users (username, email, password, join_date, birth_day, fullname) VALUES (?, ?, ?, ?, ?, ?)";
    await queryDb(sql, [username, email, hashedPassword, joinDate, birthday, fullname]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "An error occurred!", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const SESSION_EXPIRE_HOURS = parseInt(process.env.SESSION_EXPIRE_HOURS) || 1;
  const ip_address = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const user_agent = req.headers["user-agent"];

  if (!email || !password) {
    return res.status(400).json({ message: "Please fill email and password" });
  }

  try {
    const sql = "SELECT * FROM users WHERE email = ?";
    const results = await queryDb(sql, [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: `${SESSION_EXPIRE_HOURS}h` });
    const sessionSql = "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))";
    await queryDb(sessionSql, [user.id, token, ip_address, user_agent, SESSION_EXPIRE_HOURS]);


    res.json({
      message: "Login successful",
      userId: user.id,
      token,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "Token is required!" });
    }

    await queryDb("DELETE FROM sessions WHERE token = ?", [token]);
    res.json({ message: "Logout successful" });
  } catch (e) {
    console.error("Error during logout:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get('/active-users', verifyApiKey, async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT users.id, users.fullname, users.email
      FROM sessions
      JOIN users ON sessions.user_id = users.id
      WHERE sessions.expires_at > NOW()
    `;

    const activeUsers = await queryDb(sql);
    res.status(200).json(activeUsers);
  } catch (err) {
    console.error("Error fetching active users:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get('/active-admin', verifyApiKey, async (req, res) => {
  try {
    const sql = `
    SELECT DISTINCT users.id, users.fullname, users.email
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.expires_at > NOW()
    AND users.role = 'admin'
  `;

  const activeAdmin = await queryDb(sql);
  res.status(200).json(activeAdmin);
  } catch (e) {
    console.error("Error fetching active admin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;