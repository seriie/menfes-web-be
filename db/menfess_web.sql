CREATE DATABASE menfess_web;

USE menfess_web;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    join_date VARCHAR(30) NOT NULL,
    birth_day VARCHAR(10) NOT NULL,
    profile_picture VARCHAR(255),
    fullname VARCHAR(50) NOT NULL,
    role ENUM('user', 'admin', 'owner') DEFAULT 'user'
);

CREATE TABLE menfes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    visibility ENUM('public', 'private') DEFAULT 'public',
    target_user_id INT DEFAULT NULL,
    created_at VARCHAR(30) NOT NULL,
    pinned TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (likes) REFERENCES menfes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    menfes_id INT NOT NULL,
    created_at VARCHAR(30), 
    UNIQUE(user_id, menfes_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menfes_id) REFERENCES menfes(id) ON DELETE CASCADE
);

-- GET LIKES
SELECT users.username, likes.created_at 
FROM likes 
JOIN users 
ON likes.user_id = users.id 
WHERE likes.menfes_id = 66;
-- QUERY ON EXPRESS
SELECT users.username, likes.created_at 
FROM likes 
JOIN users 
ON likes.user_id = users.id 
WHERE likes.menfes_id = ?;

CREATE TABLE replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menfes_id INT NOT NULL,
    user_id INT NOT NULL,
    reply_message TEXT NOT NULL,
    created_at VARCHAR(30),
    FOREIGN KEY (menfes_id) REFERENCES menfes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE social_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instragram VARCHAR(255) NOT NULL,
    tiktok VARCHAR(255) NOT NULL,
    facebook VARCHAR(255) NOT NULL,
    twitter VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SELECT MENFES MESSAGE FROM USERNAME WHERE ID = USER_ID
SELECT username, message 
FROM users 
LEFT JOIN menfes 
ON users.id = menfes.user_id 
WHERE users.id = (SELECT id from users WHERE username = "zidan");
-- QUERY ON EXPRESS
SELECT username, message 
FROM users 
LEFT JOIN menfes 
ON users.id = menfes.user_id 
WHERE users.id = (SELECT id from users WHERE username = ?);

-- DELETE MENFES
DELETE FROM menfes WHERE user_id = (SELECT id from users WHERE username = "zidan");
-- QUERY ON EXPRESS
DELETE FROM menfes WHERE user_id = (SELECT id from users WHERE username = ?);

-- GET PUBLIC MESSAGE FROM MENFES
SELECT users.username, menfes.message 
FROM users 
JOIN menfes 
ON users.id = menfes.user_id 
WHERE menfes.visibility = 'public';
-- QUERY ON EXPRESS
SELECT users.username, menfes.message
FROM users
JOIN menfes
ON users.id = menfes.user_id
WHERE menfes.visibility = 'public';

-- GET PRIVATE MESSAGE FROM MENFES WITH TARGET USER
SELECT sender.username 
AS sender_username, menfes.message
FROM menfes
JOIN users 
AS sender 
ON menfes.user_id = sender.id
WHERE menfes.visibility = 'private' 
AND menfes.target_user_id = (SELECT id FROM users WHERE username = 'lily');
-- QUERY ON EXPRESS
SELECT sender.username 
AS sender_username, menfes.message
FROM menfes
JOIN users 
AS sender 
ON menfes.user_id = sender.id
WHERE menfes.visibility = 'private' 
AND menfes.target_user_id = (SELECT id FROM users WHERE username = ?);

-- CREATE AND USE VIEW
CREATE VIEW users_without_password AS
SELECT id, username, email, join_date, birth_day, profile_picture, fullname
FROM users;

SELECT * FROM users_without_password WHERE id = 51;
-- QUERY ON EXPRESS
SELECT * FROM users_without_password WHERE id = ?;