const express = require('express');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const verifyToken = require('../middleware/token');
require('dotenv').config();

const createUploadsFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

createUploadsFolder('./uploads/profile');

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
      cb(new Error('File must be image (JPEG/JPG/PNG)!'));
    }
  },
});

// const validApiKeys = [process.env.VALID_API_KEY];

// function verifyApiKey(req, res, next) {
//   const apiKey = req.query['KEY'];
//   if (!apiKey) {
//       return res.status(401).json({ message: 'API key is missing' });
//   }

//   if (!validApiKeys.includes(apiKey)) {
//       return res.status(403).json({ message: 'Invalid API key' });
//   }

//   next();
// }

// router.get('/:id', verifyApiKey, (req, res) => {
//   const { id } = req.params;
//   const query = "SELECT * FROM users_without_password WHERE id = ?";

//   db.query(query, [id], (err, result) => {
//     if (err) return res.status(500).json({ message: "Internal server error!" });

//     res.json(result);
//   });
// });

router.post('/upload-profile-picture', verifyToken, upload.single('profile_picture'), (req, res) => {
  const userId = req.userId;
  const profilePicture = req.file ? `uploads/profile/${req.file.filename}` : null;
  console.log(profilePicture);

  if (!profilePicture) {
    return res.status(400).json({ message: 'File must uploaded!' });
  }

  const sql = 'UPDATE users SET profile_picture = ? WHERE id = ?';
  db.query(sql, [profilePicture, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to save file to db', error: err.message });
    }
    res.status(200).json({ message: 'Profile picture uploaded successfully!', profilePicture });
  });
});

router.get('/', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = 'SELECT id, username, email, join_date, birth_day, profile_picture, fullname FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching profile data' });
    }
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
      profile_picture: user.profile_picture ? `http://localhost:9000/${user.profile_picture}` : null,
    });
  });
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
      return res.status(500).json({ message: "Failed to hash password!", error: err.message });
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

  db.query(query, params, (err, result) => {
    if (err) {
      if (profilePicture && fs.existsSync(profilePicture)) {
        fs.unlinkSync(profilePicture);
      }
      return res.status(500).json({ message: "Failed to update profile!", error: err.message });
    }

    if (result.affectedRows === 0) {
      if (profilePicture && fs.existsSync(profilePicture)) {
        fs.unlinkSync(profilePicture);
      }
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({ message: "Profile successfully updated!" });
  });
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM users WHERE id = ?";
  db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to delete accounts!", err });
      res.status(200).json({ message: "User account deleted successfully!" })
  });
});

module.exports = router;
