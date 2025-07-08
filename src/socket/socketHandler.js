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

        socket.emit('chats_joined', {
          message: `Ready to join chats as needed`,
          count: 0
        });
        
      } catch (error) {
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
        
        await message.populate('sender', 'username email avatar');
        
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();       
        const usersInRoom = new Set();
        const socketsInChatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
        
        if (socketsInChatRoom) {
          for (const socketId of socketsInChatRoom) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket && clientSocket.userId) {
              const isActivelyViewing = clientSocket.currentChatRoom === chatId;
              
              if (isActivelyViewing) {
                usersInRoom.add(clientSocket.userId.toString());
              } 
            } 
          }
        }

        io.to(`chat_${chatId}`).emit('new_message', {
          message: {
            _id: message._id,
            chatId: message.chatId,
            sender: message.sender,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            edited: message.edited,
            readBy: message.readBy
          },
          chatId,
          usersInRoom: Array.from(usersInRoom)
        });        
        if (usersInRoom.size > 0) {
          const readByEntries = Array.from(usersInRoom)
            .filter(userId => userId !== socket.userId.toString()) 
            .map(userId => ({
              user: userId,
              readAt: new Date()
            }));

          if (readByEntries.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
              $addToSet: { readBy: { $each: readByEntries } }
            });
          } 
        } 

        await notifyOfflineUsers(chat.participants, socket.userId, message);
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
      socket.on('typing_start', (data) => {

      const { chatId } = data;
      if (!chatId) {
        return;
      }
      
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
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    
    });
    
  
      socket.on('disconnect', (reason) => {
      
      
      if (socket.currentChatRoom) {
        socket.currentChatRoom = null;
      }
      
      onlineUsers.delete(socket.userId);
      
      updateUserOnlineStatus(socket.userId, false);
      
      broadcastOnlineCount(io);
      
      notifyContactsStatusChange(io, socket.userId, false);
    });
    
    
    socket.on('error', (error) => {
    });
    socket.on('join_chat_room', (data) => {
      try {
        const { chatId } = data;
        if (!chatId) {
          socket.emit('error', { message: 'chatId is required' });
          return;
        }
        
        const allRooms = Array.from(socket.rooms);
        allRooms.forEach(room => {
          if (room.startsWith('chat_') && room !== `chat_${chatId}`) {
            socket.leave(room);
          }
        });
        
        if (socket.currentChatRoom && socket.currentChatRoom !== chatId) {
        }
        
        socket.currentChatRoom = chatId;
        socket.join(`chat_${chatId}`);
        
        socket.emit('chat_room_joined', {
          chatId,
          message: `Joined chat room ${chatId}`
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });    
    socket.on('leave_chat_room', (data) => {
      try {
        const { chatId } = data;
        if (!chatId) {
          socket.emit('error', { message: 'chatId is required' });
          return;
        }
        
        
        if (socket.currentChatRoom === chatId) {
          socket.currentChatRoom = null;
        } else {
          socket.currentChatRoom = null;
        }
        
        socket.leave(`chat_${chatId}`);

        socket.emit('chat_room_left', {
          chatId,
          message: `Left chat room ${chatId}`
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to leave chat room' });
      }
    });

    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;
        
        if (!messageId || !content) {
          socket.emit('error', { message: 'messageId and content are required' });
          return;
        }
        
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Access denied: Not the message sender' });
          return;
        }

        if (Date.now() - new Date(message.createdAt).getTime() > 15 * 60 * 1000) {
          socket.emit('error', { message: 'Cannot edit messages. Max 15 minutes after sending.' });
          return;
        }
        
        message.content = content.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        
        await message.populate('sender', 'username email avatar');

        io.to(`chat_${message.chatId}`).emit('message_edited', {
          message: {
            _id: message._id,
            chatId: message.chatId,
            sender: message.sender,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            edited: message.edited,
            readBy: message.readBy
          }
        });
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async (data) => {
      try {
        const { messageId, deleteType } = data;
        
        if (!messageId || !deleteType) {
          socket.emit('error', { message: 'messageId and deleteType are required' });
          return;
        }
        
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Access denied: Not the message sender' });
          return;
        }

        if (deleteType !== 'me' && deleteType !== 'everyone') {
          socket.emit('error', { message: 'Invalid delete type' });
          return;
        }

        const chatId = message.chatId.toString();
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deleteType = deleteType;
        await message.save();

        const deleteData = {
          messageId: message._id.toString(),
          chatId: chatId,
          deleteType: deleteType
        };

        if (deleteType === 'everyone') {
          io.to(`chat_${chatId}`).emit('message_deleted', deleteData);
        } else { 
          socket.emit('message_deleted', deleteData);
        }
      
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
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