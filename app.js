const { setServers } = require('node:dns/promises');
setServers(['1.1.1.1', '8.8.8.8']); // helps Node resolve MongoDB Atlas on some networks

require('dotenv').config(); // load .env first so everything below can read it

const express = require('express');
const path = require('path');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.default || connectMongo;
const connectDB = require('./config/db.js');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

connectDB();

// Render sits behind a proxy; without this, secure cookies won't be set
app.set('trust proxy', 1);

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 14,
        httpOnly: true,       // JS in the browser can't read the cookie
        secure: isProd,       // HTTPS only in production
        sameSite: 'lax',
    },
}));

// ---------- API routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

// Unknown /api/... paths get JSON, not HTML
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ---------- Production: serve the React build ----------
if (isProd) {
    const distPath = path.join(__dirname, 'client', 'dist');
    app.use(express.static(distPath));
    // Any other URL (/auth, /post/123...) -> React Router takes over
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// ---------- Error handler (must have 4 params) ----------
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: status === 400 ? 'Invalid request body' : 'Server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});