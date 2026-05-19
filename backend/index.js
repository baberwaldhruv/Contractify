require('dotenv').config(); 
console.log("Your API Key is:", process.env.GEMINI_API_KEY);
const express = require('express');
const cors = require('cors');

// 1. ADD ERROR CATCHING AT THE TOP
process.on('uncaughtException', (err) => {
    console.error(' CRITICAL ERROR:', err.message);
    console.error(err.stack);
});

const app = express();
app.use(cors());
app.use(express.json());

// 2. LOG THE ROUTES IMPORT
console.log("📂 Loading Routes...");
const contractRoutes = require('./routes/contractRoutes');
app.use('/api/contracts', contractRoutes);
console.log("✅ Routes Loaded Successfully.");

app.get('/', (req, res) => {
    res.send("🚀 Contractify Backend is running!");
});

const PORT = process.env.PORT || 5001;

// 3. ENSURE THE SERVER STAYS ALIVE
const server = app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`✅ Server is flying on: http://localhost:${PORT}`);
    console.log(`-----------------------------------------------`);
});

// This prevents the process from exiting immediately
server.on('error', (err) => {
    console.error("❌ Server failed to start:", err);
});