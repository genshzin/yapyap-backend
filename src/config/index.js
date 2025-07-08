const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const config = {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    mongodb: {
        uri: process.env.MONGODB_URI,
    },
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRATION,
};

// MongoDB connection function
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    config,
    connectDB
};