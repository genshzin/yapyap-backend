const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return next(new Error('Authentication error: Invalid token payload'));
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = {
  authenticateSocket
};  