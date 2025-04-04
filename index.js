const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const authRoutes = require('./routes/auth');
const menfesRoutes = require('./routes/menfes');
const profilesRoutes = require('./routes/profiles');
const profileRoutes = require('./routes/profile');
const visitorRoutes = require('./routes/visitors');
// const profileRoutes = require('./routes/profileMulter');
const compression = require('compression');
const { SitemapStream, streamToPromise } = require('sitemap');
const PORT = 9000;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(compression());

app.get("/", (req, res) => res.send("Server is running!"));
app.use("/auth", authRoutes);
app.use("/menfes", menfesRoutes);
app.use('/profile', profileRoutes);
app.use('/profiles', profilesRoutes);
app.use('/visitors', visitorRoutes);

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', async (req, res) => {
  try {
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'https://menfes-web.vercel.app';
      const sitemap = new SitemapStream({ hostname: frontendBaseUrl });

      const routes = [
          { url: '/', changefreq: 'daily', priority: 1.0 },
          { url: '/login', changefreq: 'monthly', priority: 0.8 },
          { url: '/register', changefreq: 'monthly', priority: 0.8 },
          { url: '/create-menfes', changefreq: 'weekly', priority: 0.9 },
          { url: '/inbox', changefreq: 'daily', priority: 0.7 },
          { url: '/profile', changefreq: 'weekly', priority: 0.6 },
      ];

      routes.forEach(route => {
          if (route.url) {
              sitemap.write(route);
          } else {
              console.error(`Route is undefined:`, route);
          }
      });

      sitemap.end();

      const xml = await streamToPromise(sitemap);
      res.header('Content-Type', 'application/xml');
      res.send(xml.toString());
  } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
  }
});

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
module.exports = app;