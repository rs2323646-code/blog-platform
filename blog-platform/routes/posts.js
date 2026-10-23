const express = require("express");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all posts - public, newest first
router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// GET single post - public
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
});

// CREATE post - logged in users
router.post("/", protect, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      author: req.user.id,
      authorName: req.user.name
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE post - only the author
router.put("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only edit your own posts" });
  }
  post.title = req.body.title ?? post.title;
  post.content = req.body.content ?? post.content;
  post.tags = req.body.tags ?? post.tags;
  await post.save();
  res.json(post);
});

// DELETE post - only the author
router.delete("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own posts" });
  }
  await post.deleteOne();
  await Comment.deleteMany({ post: post._id });
  res.json({ message: "Post deleted" });
});

module.exports = router;
