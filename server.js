const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Increased limit for photo data

// Connection setup with URL-encoded password (%21 instead of !) & TLS options
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dev-rxven:AdrianPogi_09867%21@cluster0.uoa2qvj.mongodb.net/kierstyDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true
})
  .then(() => console.log("Connected to MongoDB successfully! 🚀"))
  .catch(err => console.error("MongoDB connection error:", err));

// 1. Comment Schema & Model
const CommentSchema = new mongoose.Schema({
  letterId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true }
});
const Comment = mongoose.model('Comment', CommentSchema);

// 2. Memory Schema & Model
const MemorySchema = new mongoose.Schema({
  caption: String,
  album: { type: String, default: "Daily" },
  image: String, // Base64 image string
  createdAt: { type: Date, default: Date.now }
});
const Memory = mongoose.model('Memory', MemorySchema);

// 3. Album Schema & Model (For MongoDB persistence)
const AlbumSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Album = mongoose.model('Album', AlbumSchema);

// 4. Bouquet Schema & Model
const BouquetSchema = new mongoose.Schema({
  flower: String,
  wrap: String,
  ribbon: String,
  imgData: String,
  date: { type: Date, default: Date.now }
});
const Bouquet = mongoose.model('Bouquet', BouquetSchema);

// ==================== API ROUTES ====================

// --- COMMENTS ROUTES ---
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

// --- ALBUMS ROUTES ---
app.get('/api/albums', async (req, res) => {
  try {
    let albums = await Album.find();
    // Seed default albums if empty
    if (albums.length === 0) {
      const defaults = ["Dates", "Trips", "Daily"];
      for (let d of defaults) {
        await Album.create({ name: d });
      }
      albums = await Album.find();
    }
    res.json(albums.map(a => a.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/albums', async (req, res) => {
  try {
    const newAlbum = new Album({ name: req.body.name });
    await newAlbum.save();
    res.status(201).json(newAlbum);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/albums', async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    await Album.findOneAndUpdate({ name: oldName }, { name: newName });
    // Also update all memories assigned to this album
    await Memory.updateMany({ album: oldName }, { album: newName });
    res.json({ message: "Album renamed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/albums/:name', async (req, res) => {
  try {
    const albumName = req.params.name;
    await Album.findOneAndDelete({ name: albumName });
    // Reassign memories in this deleted album to "Daily"
    await Memory.updateMany({ album: albumName }, { album: "Daily" });
    res.json({ message: "Album deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEMORIES (PHOTOS) ROUTES ---
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

app.put('/api/memories/:id', async (req, res) => {
  try {
    const updated = await Memory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: "Memory deleted successfully from MongoDB" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOUQUETS ROUTES ---
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});