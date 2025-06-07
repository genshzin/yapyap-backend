const express = require('express');
const { config, connectDB } = require('./config');

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route to test if server is working
app.get('/', (req, res) => {
    res.json({ 
        message: 'YapYap Backend API is running!',
        environment: config.env,
        database: 'Connected to MongoDB'
    });
});

// Health check route
app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});


const authRoutes = require('./routes/authRoutes');
// const chatRoutes = require('./routes/chatRoutes');

app.use('/auth', authRoutes);
// app.use('/chat', chatRoutes);

// Start server
app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on port ${config.port} in ${config.env} mode`);
});