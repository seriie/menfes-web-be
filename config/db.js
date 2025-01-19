const mysql = require('mysql2');
require('dotenv').config();

const db_config = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PW,
    database: process.env.DB,
    port: process.env.PORT
}

db = mysql.createConnection(db_config);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to db: ' + err.message);
        return;
    }

    console.log('Connected to db');
});

module.exports = db;