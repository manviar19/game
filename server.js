const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let dbConnected = false;
let dbStatusMessage = "In-memory database active";
let totalGamesPlayed = 42;

// Mongoose Schema & Model for Leaderboard Scores
const ScoreSchema = new mongoose.Schema({
    player: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    level: { type: Number, default: 1 },
    date: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', ScoreSchema);

// In-Memory Leaderboard Fallback
let inMemoryLeaderboard = [
    { _id: '1', player: 'CyberNinja', score: 1450, level: 8, date: new Date(Date.now() - 3600000).toISOString() },
    { _id: '2', player: 'NeonKnight', score: 1200, level: 6, date: new Date(Date.now() - 7200000).toISOString() },
    { _id: '3', player: 'RetroRacer', score: 980, level: 5, date: new Date(Date.now() - 10800000).toISOString() },
    { _id: '4', player: 'PixelMaster', score: 750, level: 4, date: new Date(Date.now() - 14400000).toISOString() },
    { _id: '5', player: 'ByteHunter', score: 520, level: 3, date: new Date(Date.now() - 18000000).toISOString() }
];

// Connect MongoDB if URI provided
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            dbConnected = true;
            dbStatusMessage = `MongoDB Connected: ${mongoose.connection.host}`;
            console.log(dbStatusMessage);
        })
        .catch(err => {
            dbConnected = false;
            dbStatusMessage = `MongoDB Connection Failed: ${err.message}. Operating in standalone mode.`;
            console.warn(dbStatusMessage);
        });
} else {
    console.log("No MONGODB_URI provided. Running in standalone mode with in-memory leaderboard.");
}

// API Routes

// 1. Health API
app.get('/api/health', (req, res) => {
    res.json({
        status: "ONLINE",
        game: "CyberSnake Neon Arcade",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        system: {
            platform: os.platform(),
            architecture: os.arch(),
            cpus: os.cpus().length,
            memoryUsagePercent: `${(((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1)}%`
        },
        database: {
            connected: dbConnected,
            status: dbStatusMessage
        }
    });
});

// 2. Fetch Leaderboard Top Scores
app.get('/api/leaderboard', async (req, res) => {
    if (dbConnected) {
        try {
            const scores = await Score.find().sort({ score: -1 }).limit(10);
            return res.json(scores);
        } catch (err) {
            console.error("Error fetching scores from DB:", err.message);
        }
    }
    // Fallback in-memory sorting
    inMemoryLeaderboard.sort((a, b) => b.score - a.score);
    res.json(inMemoryLeaderboard.slice(0, 10));
});

// 3. Submit New Score
app.post('/api/score', async (req, res) => {
    const { player, score, level } = req.body;

    if (!player || typeof score !== 'number') {
        return res.status(400).json({ error: "Invalid player name or score" });
    }

    totalGamesPlayed++;
    const newEntry = {
        _id: Math.random().toString(36).substring(2, 9),
        player: player.trim().substring(0, 15) || 'Anonymous',
        score: Math.max(0, parseInt(score)),
        level: parseInt(level) || 1,
        date: new Date().toISOString()
    };

    if (dbConnected) {
        try {
            const savedScore = await Score.create(newEntry);
            return res.json({ success: true, entry: savedScore });
        } catch (err) {
            console.error("Error saving score to DB:", err.message);
        }
    }

    inMemoryLeaderboard.push(newEntry);
    inMemoryLeaderboard.sort((a, b) => b.score - a.score);
    if (inMemoryLeaderboard.length > 50) inMemoryLeaderboard.pop();

    res.json({ success: true, entry: newEntry });
});

// 4. Game Stats
app.get('/api/stats', async (req, res) => {
    let topScore = 0;
    if (dbConnected) {
        try {
            const best = await Score.findOne().sort({ score: -1 });
            if (best) topScore = best.score;
        } catch (err) { console.error(err); }
    } else {
        topScore = inMemoryLeaderboard.length > 0 ? inMemoryLeaderboard[0].score : 0;
    }

    res.json({
        totalGamesPlayed,
        topScore,
        totalPlayers: dbConnected ? await Score.countDocuments() : inMemoryLeaderboard.length
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(` CyberSnake Game Server running on port ${PORT}`);
    console.log(` Game Web UI: http://localhost:${PORT}/`);
    console.log(` Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
    console.log(`=================================================`);
});
