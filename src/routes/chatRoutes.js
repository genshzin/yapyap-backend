const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware'); // ← Fix import
const {
  getUserChats,
  createOrGetChat,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage
} = require('../controllers/chatController');

const router = express.Router();

// Chat routes - ganti auth jadi authenticateToken
router.get('/rooms', authenticateToken, getUserChats);
router.post('/rooms', authenticateToken, createOrGetChat);
router.get('/messages', authenticateToken, getChatMessages);
router.post('/messages', authenticateToken, sendMessage);
router.patch('/messages/read', authenticateToken, markMessagesAsRead);
router.patch('/messages/:messageId', authenticateToken, editMessage);
router.delete('/messages/:messageId', authenticateToken, deleteMessage);

module.exports = router;