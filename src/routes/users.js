const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

// Search users endpoint
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    const searchQuery = {
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    };

    const users = await User.find(searchQuery)
      .select('username email avatar createdAt') // Only return safe fields
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ username: 1 });

    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
