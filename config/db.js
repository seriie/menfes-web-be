const mysql = require('mysql2');
require('dotenv').config();

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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