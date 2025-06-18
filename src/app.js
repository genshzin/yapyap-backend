const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { config, connectDB } = require('./config');

const app = express();
const server = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // For development only
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// Routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/users');
const chatRoutes = require('./routes/chatRoutes');

app.use('/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/chat', chatRoutes);

// Initialize WebSocket
const { initializeSocket } = require('./socket/socketHandler');
initializeSocket(io);

// Start server (change from app.listen to server.listen)
server.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on port ${config.port} in ${config.env} mode`);
    console.log(`WebSocket server ready at ws://localhost:${config.port}`);
});