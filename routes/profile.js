const express = require('express');
const queryDb = require('../helper/query');
const { upload } = require('../config/cloudinary');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware/token');
const verifyApiKey = require('../middleware/api_key');
const router = express.Router();

// Routes
router.post('/upload-profile-picture', verifyToken, upload.single('profile_picture'), async (req, res) => {
  const userId = req.userId;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File must be uploaded!' });
    }

    const profilePicture = req.file.path; // URL file in Cloudinary
    const sql = 'UPDATE users SET profile_picture = ? WHERE id = ?';
    await queryDb(sql, [profilePicture, userId]);

    res.status(200).json({
      message: 'Profile picture uploaded successfully!',
      profilePicture,
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err.message);
    res.status(500).json({ message: 'Failed to upload profile picture!' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const sql = 'SELECT id, username, email, join_date, birth_day, profile_picture, fullname, role FROM users WHERE id = ?';
    const results = await queryDb(sql, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    res.json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      join_date: user.join_date,
      birth_day: user.birth_day,
      profile_picture: user.profile_picture,
      role: user.role
    });
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ message: 'Error fetching profile data' });
  }
});

router.post('/role/:id', async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  try {
    const sql = 'UPDATE users SET role = ? WHERE id = ?';
    await queryDb(sql, [role, id]);

    res.status(200).json({ message: 'Role updated successfully!' });
  } catch (e) {
    res.status(500).json({ message: "An error occurred" });
  }
});

router.get('/profiles/:username', verifyApiKey, async (req, res) => {
  try {
    const { username } = req.params;
    const query = 'SELECT id, username, join_date, profile_picture, role FROM users WHERE username = ?';
    const profiles = await queryDb(query, [username]);

    if (profiles.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(profiles[0]);
  } catch (e) {
    res.status(500).json({ message: "An error occurred" });
  }
});

router.put('/:id', verifyToken, upload.single('profile_picture'), async (req, res) => {
  const { id } = req.params;
  const { username, email, password, fullname, birth_day } = req.body;
  const profilePicture = req.file ? req.file.path : null;

  let query = "UPDATE users SET ";
  const params = [];

  if (username) {
    query += "username = ?, ";
    params.push(username);
  }
  if (email) {
    query += "email = ?, ";
    params.push(email);
  }
  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += "password = ?, ";
      params.push(hashedPassword);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to hash password!', error: err.message });
    }
  }
  if (fullname) {
    query += "fullname = ?, ";
    params.push(fullname);
  }
  if (birth_day) {
    query += "birth_day = ?, ";
    params.push(birth_day);
  }
  if (profilePicture) {
    query += "profile_picture = ?, ";
    params.push(profilePicture);
  }

  query = query.slice(0, -2) + " WHERE id = ?";
  params.push(id);

  try {
    const result = await queryDb(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }
    res.status(200).json({ message: 'Profile successfully updated!' });
  } catch (err) {
    console.error('SQL Error:', err.message);
    res.status(500).json({ message: 'Failed to update profile!', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM users WHERE id = ?";
    const result = await queryDb(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }
    res.status(200).json({ message: 'User account deleted successfully!' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Failed to delete account!' });
  }
});

module.exports = router;