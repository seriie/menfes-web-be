const mysql = require('mysql2');
require('dotenv').config();

const db_config = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PW,
    database: process.env.DB,
    port: process.env.PORT,
    waitForConnections: true,
    connectionLimit: 10, // Maksimal koneksi dalam pool
    queueLimit: 0 // Tidak ada limit antrean koneksi
};

const pool = mysql.createPool(db_config);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to db: ' + err.message);
        return;
    }

    console.log('Connected to db');
    connection.release();
});

module.exports = pool;