const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Get user's chats with last message preview
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'username avatar isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    })
    .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: req.user.id },
          'readBy.user': { $ne: req.user.id }
        });
        
        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create or get existing chat
const createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] },
      type: 'direct'
    }).populate('participants', 'username avatar isOnline lastSeen');
    
    if (chat) {
      return res.json(chat);
    }
    
    // Create new chat
    chat = new Chat({
      participants: [req.user.id, participantId],
      type: 'direct'
    });
    
    await chat.save();
    await chat.populate('participants', 'username avatar isOnline lastSeen');
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update getChatMessages
const getChatMessages = async (req, res) => {
  try {
    const { chatId, page = 1, limit = 50 } = req.query; // ← Change to req.query
    
    if (!chatId) {
      return res.status(400).json({ error: 'chatId query parameter is required' });
    }
    
    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ chatId })
      .populate('sender', 'username avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages: messages.reverse(),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update sendMessage
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo } = req.body; // ← chatId from body
    
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = new Message({
      chatId,
      sender: req.user.id,
      content: content.trim(),
      type,
      replyTo: replyTo || undefined
    });

    await message.save();
    
    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'replyTo', select: 'content sender' }
    ]);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update markMessagesAsRead
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId, messageIds } = req.body; // ← chatId from body
    
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    
    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        chatId: chatId
      },
      { 
        $addToSet: { 
          readBy: { 
            user: req.user.id, 
            readAt: new Date() 
          } 
        } 
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only sender can edit their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username avatar');
    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only sender can delete their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserChats,
  createOrGetChat,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage
};