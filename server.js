const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware: Increase payload limits to 50MB for high-res Base64 photos
// ✅ Replace app.use(cors()); with this:
// ✅ Make sure line 9 in server.js looks exactly like this:
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this line directly below it to allow pre-flight OPTIONS requests across all routes
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connection setup
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dev-rxven:AdrianPogi_09867%21@cluster0.uoa2qvj.mongodb.net/kierstyDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true
})
  .then(() => console.log("Connected to MongoDB successfully! 🚀"))
  .catch(err => console.error("MongoDB connection error:", err));

// 1. Comment Schema
const CommentSchema = new mongoose.Schema({
  letterId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true }
});
const Comment = mongoose.model('Comment', CommentSchema);

// 2. Reaction Schema
const ReactionSchema = new mongoose.Schema({
  letterId: { type: String, required: true, unique: true },
  emoji: { type: String, default: "" }
});
const Reaction = mongoose.model('Reaction', ReactionSchema);

// 3. Memory Schema
const MemorySchema = new mongoose.Schema({
  caption: { type: String, default: "" },
  album: { type: String, default: "Daily" },
  image: { type: String, required: true }, // Base64 image
  createdAt: { type: Date, default: Date.now }
});
const Memory = mongoose.model('Memory', MemorySchema);

// 4. Album Schema
const AlbumSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Album = mongoose.model('Album', AlbumSchema);

// 5. Bouquet Schema
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
    const { letterId, text, time } = req.body;
    if (!letterId || !text) {
      return res.status(400).json({ error: "letterId and text are required" });
    }
    const newComment = new Comment({
      letterId,
      text,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/comments/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid comment ID format" });
    }
    const updated = await Comment.findByIdAndUpdate(
      req.params.id, 
      { text: req.body.text }, 
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Comment not found in database" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid comment ID format" });
    }
    const deleted = await Comment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found in database" });
    }
    res.json({ message: "Comment deleted successfully from MongoDB" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REACTIONS ROUTES ---
app.get('/api/reactions/:letterId', async (req, res) => {
  try {
    const reaction = await Reaction.findOne({ letterId: req.params.letterId });
    res.json(reaction || { letterId: req.params.letterId, emoji: "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reactions', async (req, res) => {
  try {
    const { letterId, emoji } = req.body;
    const reaction = await Reaction.findOneAndUpdate(
      { letterId },
      { emoji },
      { upsert: true, new: true }
    );
    res.json(reaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ALBUMS ROUTES ---
app.get('/api/albums', async (req, res) => {
  try {
    let albums = await Album.find();
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
    console.log("📸 New photo saved successfully to MongoDB!");
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error saving photo:", err.message);
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