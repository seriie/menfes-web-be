const express = require('express');
const queryDb = require('../helper/query');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware/token');
const router = express.Router();
require('dotenv').config();

// Helper: Delete File
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Create uploads folder if not exists
const createUploadsFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};
createUploadsFolder('./uploads/profile');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/profile');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('File must be an image (JPEG/JPG/PNG)!'));
    }
  },
});

// Routes
router.post('/upload-profile-picture', verifyToken, upload.single('profile_picture'), async (req, res) => {
  const userId = req.userId;
  const profilePicture = req.file ? `uploads/profile/${req.file.filename}` : null;

  if (!profilePicture) {
    return res.status(400).json({ message: 'File must be uploaded!' });
  }

  try {
    const sql = 'UPDATE users SET profile_picture = ? WHERE id = ?';
    await queryDb(sql, [profilePicture, userId]);
    res.status(200).json({ message: 'Profile picture uploaded successfully!', profilePicture });
  } catch (err) {
    deleteFile(profilePicture);
    console.error('Error uploading profile picture:', err.message);
    res.status(500).json({ message: 'Failed to save file to database' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const sql = 'SELECT id, username, email, join_date, birth_day, profile_picture, fullname FROM users WHERE id = ?';
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
      profile_picture: user.profile_picture ? `${process.env.BASE_URL}/${user.profile_picture}` : null,
    });
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ message: 'Error fetching profile data' });
  }
});

router.put('/:id', verifyToken, upload.single('profile_picture'), async (req, res) => {
  const { id } = req.params;
  const { username, email, password, fullname, birth_day } = req.body;
  const profilePicture = req.file ? `uploads/profile/${req.file.filename}` : null;

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
      deleteFile(profilePicture);
      return res.status(404).json({ message: 'User not found!' });
    }
    res.status(200).json({ message: 'Profile successfully updated!' });
  } catch (err) {
    deleteFile(profilePicture);
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Failed to update profile!' });
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