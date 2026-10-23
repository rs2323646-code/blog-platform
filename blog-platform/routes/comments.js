const express = require("express");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET comments for a post - public
router.get("/:postId", async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId }).sort({ createdAt: 1 });
  res.json(comments);
});

// ADD comment - logged in users
router.post("/:postId", protect, async (req, res) => {
  try {
    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user.id,
      authorName: req.user.name,
      text: req.body.text
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE comment - only the author
router.delete("/:id", protect, async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (comment.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own comments" });
  }
  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
});

module.exports = router;
