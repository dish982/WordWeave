// routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');


// SIGNUP LOGIC
router.post('/signup', async (req, res) => {

    try {   
        const { password, username } = req.body;
        const email = req.body.email?.toLowerCase().trim();

        if (!email || !password || !username ) {
            return res.status(400).json({error: 'Please fill in all fields.'});
        }

        if (username.length < 3 || username.length > 15) {
            return res.status(400).json({ 
                error: 'Username must be between 3 and 15 characters long.' 
            });
        }
                
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;

        if (!usernameRegex.test(username)) {
            return res.status(400).json({ error: 'Username can only contain alphanumeric characters, underscores, and hyphens.' 
            });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ error: 'User already exists! Please login.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username is already taken!' });
        }

        // Generate a 16-byte unique salt for this user
        const salt = crypto.randomBytes(16).toString('hex');

        // Hash the password cleanly using crypto (1000 iterations, 64-char length, sha512)
        const hashedPassword = crypto.pbkdf2Sync(String(password), salt, 1000, 64, 'sha512').toString('hex');

        // Save everything into MongoDB
        user = new User({
            username,
            email,
            salt,
            password: hashedPassword
        });

        await user.save();
        return res.status(201).json({ message: 'Account created successfully! Please login.'});

    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ error: 'Server Error during registration'});
    }
});

// LOGIN LOGIC
router.post('/login', async (req, res) => {

    try {
        const { password } = req.body;
        const email = req.body.email?.toLowerCase().trim();

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter both email and password.'});
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
           return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Hash the incoming login password using the users unique saved salt
        const verifyHash = crypto.pbkdf2Sync(String(password), user.salt, 1000, 64, 'sha512').toString('hex');

        if (user.password !== verifyHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        //remember who logged in
        req.session.user = {
            id: user._id,
            email: user.email,
            username: user.username
        };

        req.session.save((err) => {
            if (err) {
                console.error("Session Save Error:", err);
                return res.status(500).json({ error: "Session allocation failure"});
            }
            
            return res.json({user: req.session.user});
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({error: 'Server Error during login'});
    }
});


//LOGOUT
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error: ", err);
            console.log(err);
            return res.status(500).json({error: "Could not log you out. Please try agian"});
        }

        res.clearCookie("connect.sid");
        res.json({message: "Logged out"});
    });
});

router.get('/me', (req, res) => {
    res.json({ user: req.session.user || null });
});

module.exports = router;