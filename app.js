const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const connectDB = require('./config/db.js');
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.default || connectMongo;
const app = express();

// Load environment variables 
dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;


//parse form data
app.use(express.json());

//Serve static files (css, images)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
    }), 
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 14, 
        secure: false, 
        httpOnly: true 
    }
}));


//Routes
const authRoutes = require('./routes/auth'); 
// const blogRoutes = require('./routes/blog');

app.use('/api/auth', authRoutes); 
// app.use('/', blogRoutes);

//Start the server 
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}/`);
});