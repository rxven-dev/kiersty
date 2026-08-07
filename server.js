const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware & CORS Settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Atlas Connection Setup
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dev-rxven:AdrianPogi_09867%21@cluster0.uoa2qvj.mongodb.net/kierstyDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true
})
  .then(() => console.log("Connected to MongoDB successfully! 🚀"))
  .catch(err => console.error("MongoDB connection error:", err));


// ==========================================
// SCHEMAS & MODELS
// ==========================================

// 1. Comment Schema
const CommentSchema = new mongoose.Schema({
  letterId: { type: String, required: true },
  text: { type: String, required: true },
  author: { type: String, default: "Babyy 💕" },
  createdAt: { type: Date, default: Date.now }
});

// 2. Reaction Schema
const ReactionSchema = new mongoose.Schema({
  letterId: { type: String, required: true, unique: true },
  counts: {
    "❤️": { type: Number, default: 0 },
    "👍": { type: Number, default: 0 },
    "👎": { type: Number, default: 0 }
  },
  userVotes: {
    "❤️": { type: Boolean, default: false },
    "👍": { type: Boolean, default: false },
    "👎": { type: Boolean, default: false }
  }
});

// 3. Memory Schema
const MemorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// 4. Bouquet Schema
const BouquetSchema = new mongoose.Schema({
  flower: String,
  wrapColor: String,
  ribbonColor: String,
  date: { type: Date, default: Date.now }
});

// 5. Jar Favorites Schema
const JarFavoriteSchema = new mongoose.Schema({
  reasonText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 6. Custom Wheel Options Schema
const WheelOptionSchema = new mongoose.Schema({
  category: { type: String, default: 'custom' },
  label: { type: String, required: true }
});

const Comment = mongoose.model('Comment', CommentSchema);
const Reaction = mongoose.model('Reaction', ReactionSchema);
const Memory = mongoose.model('Memory', MemorySchema);
const Bouquet = mongoose.model('Bouquet', BouquetSchema);
const JarFavorite = mongoose.model('JarFavorite', JarFavoriteSchema);
const WheelOption = mongoose.model('WheelOption', WheelOptionSchema);


// ==========================================
// API ROUTES
// ==========================================

// --- COMMENTS ROUTES ---
app.get('/api/comments/:letterId', async (req, res) => {
  try {
    const comments = await Comment.find({ letterId: req.params.letterId }).sort({ createdAt: -1 });
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

app.put('/api/comments/:id', async (req, res) => {
  try {
    const updated = await Comment.findByIdAndUpdate(req.params.id, { text: req.body.text }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- REACTIONS ROUTES ---
app.get('/api/reactions/:letterId', async (req, res) => {
  try {
    let reaction = await Reaction.findOne({ letterId: req.params.letterId });
    if (!reaction) {
      reaction = await Reaction.create({ letterId: req.params.letterId });
    }
    res.json(reaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reactions/:letterId', async (req, res) => {
  try {
    const { counts, userVotes } = req.body;
    const updated = await Reaction.findOneAndUpdate(
      { letterId: req.params.letterId },
      { counts, userVotes },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// --- MEMORIES ROUTES ---
app.get('/api/memories', async (req, res) => {
  try {
    const memories = await Memory.find().sort({ date: -1 });
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

app.delete('/api/memories/:id', async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: "Memory deleted successfully" });
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


// --- JAR FAVORITES ROUTES ---
app.get('/api/jar/favorites', async (req, res) => {
  try {
    const favorites = await JarFavorite.find().sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jar/favorites', async (req, res) => {
  try {
    const fav = new JarFavorite(req.body);
    const saved = await fav.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/jar/favorites/:id', async (req, res) => {
  try {
    await JarFavorite.findByIdAndDelete(req.params.id);
    res.json({ message: "Favorite removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- WHEEL OPTIONS ROUTES ---
app.get('/api/wheel/options', async (req, res) => {
  try {
    const options = await WheelOption.find();
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wheel/options', async (req, res) => {
  try {
    const option = new WheelOption(req.body);
    const saved = await option.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/wheel/options/:id', async (req, res) => {
  try {
    await WheelOption.findByIdAndDelete(req.params.id);
    res.json({ message: "Option removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT} 🚀`));