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
        console.log('=== JOIN CHATS REQUEST ===');
        console.log('From user:', socket.user.username, 'ID:', socket.userId);
        
        // Don't auto-join all chat rooms anymore
        // Users will only join specific rooms when they actively view them
        
        socket.emit('chats_joined', {
          message: `Ready to join chats as needed`,
          count: 0
        });
        
        console.log('=== JOIN CHATS COMPLETED ===');
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
        
        // Populate sender with full user data
        await message.populate('sender', 'username email avatar');
        
        // Update chat
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();        // Get users currently in this specific chat room and actively viewing it
        const usersInRoom = new Set();
        const socketsInChatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
        
        console.log(`=== AUTO-READ LOGIC DEBUG for chat ${chatId} ===`);
        console.log(`Message sender: ${socket.userId} (${socket.user.username})`);
        console.log(`Total sockets in room chat_${chatId}:`, socketsInChatRoom ? Array.from(socketsInChatRoom).length : 0);
        
        if (socketsInChatRoom) {
          console.log(`Detailed socket analysis for room chat_${chatId}:`);
          for (const socketId of socketsInChatRoom) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket && clientSocket.userId) {
              const isActivelyViewing = clientSocket.currentChatRoom === chatId;
              console.log(`  Socket ${socketId}:`);
              console.log(`    - userId: ${clientSocket.userId}`);
              console.log(`    - username: ${clientSocket.user?.username}`);
              console.log(`    - currentChatRoom: ${clientSocket.currentChatRoom}`);
              console.log(`    - isActivelyViewing: ${isActivelyViewing}`);
              console.log(`    - shouldAutoRead: ${isActivelyViewing && clientSocket.userId.toString() !== socket.userId}`);
              
              // Only count users who are ACTIVELY viewing this specific chat room
              if (isActivelyViewing) {
                usersInRoom.add(clientSocket.userId.toString());
                console.log(`    ✓ Added to usersInRoom`);
              } else {
                console.log(`    ✗ NOT added to usersInRoom`);
              }
            } else {
              console.log(`  Socket ${socketId}: INVALID or missing userId`);
            }
          }
        }
        
        console.log(`Final usersInRoom count: ${usersInRoom.size}`);
        console.log(`Users actively viewing room: [${Array.from(usersInRoom).join(', ')}]`);
        console.log(`=== END AUTO-READ LOGIC DEBUG ===`);
        
        // Emit the message to all chat participants
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
        });        // Auto-mark as read ONLY for users actively viewing this chat room
        if (usersInRoom.size > 0) {
          const readByEntries = Array.from(usersInRoom)
            .filter(userId => userId !== socket.userId.toString()) // Don't add sender to readBy
            .map(userId => ({
              user: userId,
              readAt: new Date()
            }));
          
          console.log(`🔍 AUTO-READ ANALYSIS:`);
          console.log(`  - Total usersInRoom: ${usersInRoom.size}`);
          console.log(`  - Sender: ${socket.userId}`);
          console.log(`  - Users to auto-read (excluding sender): ${readByEntries.length}`);
          console.log(`  - ReadBy entries:`, readByEntries);
          
          if (readByEntries.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
              $addToSet: { readBy: { $each: readByEntries } }
            });
            console.log(`✅ Auto-marked message as read for ${readByEntries.length} users actively viewing room`);
          } else {
            console.log(`⚠️ No other users to auto-read (sender only or empty room)`);
          }
        } else {
          console.log('❌ No users actively viewing this chat room - message will remain unread');
        }

        // Notify offline users (optional - for push notifications)
        await notifyOfflineUsers(chat.participants, socket.userId, message);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
      socket.on('typing_start', (data) => {
      console.log('=== TYPING START RECEIVED ===');
      console.log('From user:', socket.user.username);
      console.log('Data:', data);
      
      const { chatId } = data;
      if (!chatId) {
        console.log('No chatId provided');
        return;
      }
      
      console.log('Broadcasting to chat room:', `chat_${chatId}`);
      console.log('Payload:', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
      
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
      
      console.log('=== TYPING START BROADCAST COMPLETED ===');
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
      console.log(`User ${socket.user.username} (${socket.userId}) disconnected: ${reason}`);
      
      // Clear current chat room tracking
      if (socket.currentChatRoom) {
        console.log(`Clearing currentChatRoom ${socket.currentChatRoom} for disconnected user ${socket.userId}`);
        socket.currentChatRoom = null;
      }
      
      onlineUsers.delete(socket.userId);
      
      updateUserOnlineStatus(socket.userId, false);
      
      broadcastOnlineCount(io);
      
      notifyContactsStatusChange(io, socket.userId, false);
    });
    
    
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.username}:`, error);
    });
      // Handle joining specific chat room
    socket.on('join_chat_room', (data) => {
      try {
        const { chatId } = data;
        if (!chatId) {
          socket.emit('error', { message: 'chatId is required' });
          return;
        }
        
        // Leave ALL chat rooms first to ensure user is only in one active chat room
        const allRooms = Array.from(socket.rooms);
        allRooms.forEach(room => {
          if (room.startsWith('chat_') && room !== `chat_${chatId}`) {
            socket.leave(room);
            console.log(`User ${socket.user.username} left room: ${room}`);
          }
        });
        
        // Clear any previous chat room tracking
        if (socket.currentChatRoom && socket.currentChatRoom !== chatId) {
          console.log(`User ${socket.user.username} cleared previous chat room: ${socket.currentChatRoom}`);
        }
        
        // Set current chat room and join
        socket.currentChatRoom = chatId;
        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.user.username} (${socket.userId}) joined chat room: chat_${chatId}`);
        console.log(`Socket ${socket.id} currentChatRoom set to: ${chatId}`);
        
        socket.emit('chat_room_joined', {
          chatId,
          message: `Joined chat room ${chatId}`
        });
      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });    // Handle leaving specific chat room
    socket.on('leave_chat_room', (data) => {
      try {
        const { chatId } = data;
        if (!chatId) {
          socket.emit('error', { message: 'chatId is required' });
          return;
        }
        
        console.log(`=== LEAVE CHAT ROOM DEBUG ===`);
        console.log(`User ${socket.user.username} (${socket.userId}) attempting to leave chat room: ${chatId}`);
        console.log(`Current socket.currentChatRoom: ${socket.currentChatRoom}`);
        console.log(`Socket rooms before leave:`, Array.from(socket.rooms));
        
        // Show users in room BEFORE this user leaves
        const socketsInRoomBefore = io.sockets.adapter.rooms.get(`chat_${chatId}`);
        console.log(`Sockets in room chat_${chatId} BEFORE leave:`, socketsInRoomBefore ? Array.from(socketsInRoomBefore).map(sid => {
          const s = io.sockets.sockets.get(sid);
          return s ? `${s.userId}(${s.currentChatRoom})` : 'unknown';
        }) : []);
        
        // Clear current chat room tracking BEFORE leaving the room
        if (socket.currentChatRoom === chatId) {
          socket.currentChatRoom = null;
          console.log(`✓ Socket ${socket.id} currentChatRoom cleared for chat ${chatId}`);
        } else {
          console.log(`⚠️ Socket currentChatRoom (${socket.currentChatRoom}) does not match chatId (${chatId})`);
          // Still clear it to be safe
          socket.currentChatRoom = null;
          console.log(`✓ Cleared currentChatRoom anyway for safety`);
        }
        
        socket.leave(`chat_${chatId}`);
        console.log(`✓ Socket.leave() called for chat_${chatId}`);
        console.log(`Socket rooms after leave:`, Array.from(socket.rooms));
        
        // Debug: Show remaining users in room after this user left
        const remainingSockets = io.sockets.adapter.rooms.get(`chat_${chatId}`);
        console.log(`Remaining sockets in room chat_${chatId} AFTER leave:`, remainingSockets ? Array.from(remainingSockets).map(sid => {
          const s = io.sockets.sockets.get(sid);
          return s ? `${s.userId}(${s.currentChatRoom})` : 'unknown';
        }) : []);
        
        console.log(`=== END LEAVE CHAT ROOM DEBUG ===`);
        
        socket.emit('chat_room_left', {
          chatId,
          message: `Left chat room ${chatId}`
        });
      } catch (error) {
        console.error('Error leaving chat room:', error);
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
        console.error('Error editing message:', error);
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
          // Siarkan ke semua orang di room bahwa pesan ini ditandai sebagai terhapus
          io.to(`chat_${chatId}`).emit('message_deleted', deleteData);
        } else { // deleteType === 'me'
          // Kirim konfirmasi hanya ke diri sendiri
          socket.emit('message_deleted', deleteData);
        }
      
        
      } catch (error) {
        console.error('Error deleting message:', error);
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


const notifyOfflineUsers = async (participants, senderId, message) => {
  try {
    // Find offline participants
    const offlineParticipants = participants.filter(id => 
      id.toString() !== senderId && !onlineUsers.has(id.toString())
    );

    // Here you can implement push notifications for offline users
    // For now, just log
    if (offlineParticipants.length > 0) {
      console.log(`Notification needed for offline users: ${offlineParticipants}`);
    }
  } catch (error) {
    console.error('Error notifying offline users:', error);
  }
};

module.exports = { 
  initializeSocket,
  onlineUsers
};