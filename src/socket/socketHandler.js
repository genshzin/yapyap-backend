const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { authenticateSocket } = require('../middlewares/socketMiddleware');



const onlineUsers = new Map();

const initializeSocket = (io) => {
  
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    
    
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });
    
    
    socket.join(`user_${socket.userId}`);
    
    
    updateUserOnlineStatus(socket.userId, true);
    
    
    broadcastOnlineCount(io);
    
    
    notifyContactsStatusChange(io, socket.userId, true);
    
    
    socket.on('join_chats', async () => {
      try {
        const userChats = await Chat.find({ 
          participants: socket.userId 
        }).select('_id');
        
        userChats.forEach(chat => {
          socket.join(`chat_${chat._id}`);
        });
        
        socket.emit('chats_joined', {
          message: `Joined ${userChats.length} chats`,
          count: userChats.length
        });        
      } catch (error) {
        console.error('Error joining chats:', error);
        socket.emit('error', { message: 'Failed to join chats' });
      }
    });
    
    
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text' } = data;
        
        if (!chatId || !content) {
          socket.emit('error', { message: 'chatId and content are required' });
          return;
        }
        
        
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied: Not a participant' });
          return;
        }
        
        
        const message = new Message({
          chatId,
          sender: socket.userId,
          content: content.trim(),
          type
        });
        
        await message.save();
        await message.populate('sender', 'username avatar');
        
        
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();
        
        
        io.to(`chat_${chatId}`).emit('new_message', {
          message,
          chatId
        });
        
        
        
        await notifyOfflineUsers(chat.participants, socket.userId, message);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      if (!chatId) return;
      
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
      
    });
    
    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      if (!chatId) return;
      
      socket.to(`chat_${chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
      
    });
    
    
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, messageIds } = data;
        
        if (!chatId || !messageIds) {
          socket.emit('error', { message: 'chatId and messageIds are required' });
          return;
        }
        
        
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
        
        await Message.updateMany(
          { _id: { $in: messageIds }, chatId },
          { 
            $addToSet: { 
              readBy: { 
                user: socket.userId, 
                readAt: new Date() 
              } 
            } 
          }
        );
        
        
        socket.to(`chat_${chatId}`).emit('messages_read', {
          messageIds,
          readBy: socket.userId,
          readAt: new Date()
        });
        
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
    
    
    socket.on('disconnect', (reason) => {
      
      
      onlineUsers.delete(socket.userId);
      
      
      updateUserOnlineStatus(socket.userId, false);
      
      
      broadcastOnlineCount(io);
      
      
      notifyContactsStatusChange(io, socket.userId, false);
    });
    
    
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.username}:`, error);
    });
  });
};


const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const broadcastOnlineCount = (io) => {
  io.emit('online_count', {
    count: onlineUsers.size,
    users: Array.from(onlineUsers.values()).map(u => ({
      id: u.user._id,
      username: u.user.username
    }))
  });
};

const notifyContactsStatusChange = async (io, userId, isOnline) => {
  try {
    
    const userChats = await Chat.find({ participants: userId }).populate('participants', '_id');
    
    
    const contactIds = new Set();
    userChats.forEach(chat => {
      chat.participants.forEach(participant => {
        if (participant._id.toString() !== userId) {
          contactIds.add(participant._id.toString());
        }
      });
    });
    
    
    contactIds.forEach(contactId => {
      io.to(`user_${contactId}`).emit('user_status_change', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    });
  } catch (error) {
    console.error('Error notifying contacts:', error);
  }
};


module.exports = { 
  initializeSocket,
  onlineUsers
};