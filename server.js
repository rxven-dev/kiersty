const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Higher limit for images/photos

// 1. Connect to MongoDB
// (We will replace this string with your real MongoDB Atlas link in the next step)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kierstyDB";

mongoose.connect(MONGO_URI)
  .then(() => console.log(" Connected to MongoDB successfully!"))
  .catch(err => console.error(" MongoDB connection error:", err));

// 2. Database Schemas
const CommentSchema = new mongoose.Schema({
  letterId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true }
});

const MemorySchema = new mongoose.Schema({
  title: String,
  caption: String,
  album: String,
  image: String, // Base64 image string
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', CommentSchema);
const Memory = mongoose.model('Memory', MemorySchema);

// 3. API Routes

// --- COMMENTS (For notes.js) ---
app.get('/api/comments/:letterId', async (req, res) => {
  try {
    const comments = await Comment.find({ letterId: req.params.letterId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- MEMORIES (For memories.js) ---
app.get('/api/memories', async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const newMemory = new Memory(req.body);
    const saved = await newMemory.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

// --- Add Bouquet Schema ---
const BouquetSchema = new mongoose.Schema({
    flower: String,
    wrap: String,
    ribbon: String,
    imgData: String, // Base64 canvas image data
    date: { type: Date, default: Date.now }
});

const Bouquet = mongoose.model('Bouquet', BouquetSchema);

// --- Add API Routes for Bouquets ---
app.get('/api/bouquets', async (req, res) => {
    try {
        const bouquets = await Bouquet.find().sort({ date: -1 });
        res.json(bouquets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bouquets', async (req, res) => {
    try {
        const newBouquet = new Bouquet(req.body);
        const saved = await newBouquet.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/bouquets/:id', async (req, res) => {
    try {
        await Bouquet.findByIdAndDelete(req.params.id);
        res.json({ message: "Bouquet deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});