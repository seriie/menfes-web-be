const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const authRoutes = require('./routes/auth');
const menfesRoutes = require('./routes/menfes');
const profileRoutes = require('./routes/profile');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => res.send("Server is running!"));
app.use("/auth", authRoutes);
app.use("/menfes", menfesRoutes);
app.use('/profile', profileRoutes);

const PORT = 9000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// module.exports = app;