// routes/posts.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Post = require('../models/Post');

// ---------- helpers ----------

function requireLogin(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ error: 'Please log in' });
    }
    next();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function formatPost(post, myId) {
    const author = post.userId; // populated: { _id, username } or null
    return {
        _id: post._id,
        title: post.title,
        content: post.content,
        isPublic: post.isPublic,
        createdAt: post.createdAt,
        author: author
            ? { _id: author._id, username: author.username }
            : { _id: null, username: 'Anonymous Writer' },
        isOwner: !!myId && !!author && author._id.toString() === myId.toString(),
    };
}

// Used by PUT and DELETE. Returns the post, or sends the error response and returns null.
async function findPostForWrite(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ error: 'Post not found' });
        return null;
    }

    const post = await Post.findById(id); // no populate: post.userId is a plain ObjectId
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return null;
    }

    const isOwner = post.userId.toString() === req.session.user.id.toString();
    if (!isOwner) {
        // private post -> pretend it doesn't exist; public post -> "you can't touch it"
        if (!post.isPublic) {
            res.status(404).json({ error: 'Post not found' });
        } else {
            res.status(403).json({ error: 'You do not own this post' });
        }
        return null;
    }
    return post;
}

// ---------- routes ----------

// FEED
router.get('/', async (req, res) => {
    try {
        const myId = req.session?.user?.id;

        const query = myId
            ? { $or: [{ isPublic: true }, { userId: myId }] }
            : { isPublic: true };

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        if (search) {
            const regex = { $regex: escapeRegex(search), $options: 'i' };
            query.$and = [{ $or: [{ title: regex }, { content: regex }] }];
        }

        const posts = await Post.find(query)
            .select('-content')
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        res.json({ posts: posts.map((p) => formatPost(p, myId)) });
    } catch (err) {
        console.error('Feed Error:', err);
        res.status(500).json({ error: 'Could not load posts' });
    }
});

// SINGLE POST
router.get('/:id', async (req, res) => {
    try {
        const myId = req.session?.user?.id;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = await Post.findById(id).populate('userId', 'username');
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const formatted = formatPost(post, myId);
        if (!post.isPublic && !formatted.isOwner) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ post: formatted });
    } catch (err) {
        console.error('Show Post Error:', err);
        res.status(500).json({ error: 'Could not load post' });
    }
});

// CREATE
router.post('/', requireLogin, async (req, res) => {
    try {
        const { title, content, isPublic } = req.body;

        if (typeof title !== 'string' || typeof content !== 'string' ||
            !title.trim() || !content.trim()) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        if (title.trim().length > 150) {
            return res.status(400).json({ error: 'Title must be 150 characters or fewer' });
        }

        const post = await Post.create({
            title: title.trim(),
            content,
            userId: req.session.user.id,
            isPublic: isPublic === true,
        });
        await post.populate('userId', 'username');

        res.status(201).json({ post: formatPost(post, req.session.user.id) });
    } catch (err) {
        console.error('Create Post Error:', err);
        res.status(500).json({ error: 'Could not save post' });
    }
});

// UPDATE
router.put('/:id', requireLogin, async (req, res) => {
    try {
        const post = await findPostForWrite(req, res);
        if (!post) return; // findPostForWrite already responded

        const { title, content, isPublic } = req.body;

        if (typeof title !== 'string' || typeof content !== 'string' ||
            !title.trim() || !content.trim()) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        if (title.trim().length > 150) {
            return res.status(400).json({ error: 'Title must be 150 characters or fewer' });
        }

        post.title = title.trim();
        post.content = content;
        if (typeof isPublic === 'boolean') post.isPublic = isPublic;
        await post.save();
        await post.populate('userId', 'username');

        res.json({ post: formatPost(post, req.session.user.id) });
    } catch (err) {
        console.error('Update Post Error:', err);
        res.status(500).json({ error: 'Could not update post' });
    }
});

// DELETE
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        const post = await findPostForWrite(req, res);
        if (!post) return;

        await Post.deleteOne({ _id: post._id });
        res.json({ message: 'Post deleted' });
    } catch (err) {
        console.error('Delete Post Error:', err);
        res.status(500).json({ error: 'Could not delete post' });
    }
});

module.exports = router;