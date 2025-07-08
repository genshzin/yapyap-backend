const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();


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
        { _id: { $ne: req.user.id } }, 
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    };

    const users = await User.find(searchQuery)
      .select('username email avatar createdAt') 
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

router.get('/:id/profile-picture', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profilePicture || !user.profilePicture.data) {
      return res.status(404).send('No profile picture');
    }
    res.set('Content-Type', user.profilePicture.contentType || 'image/jpeg');
    res.send(user.profilePicture.data);
  } catch (error) {
    res.status(500).send('Server error');
  }
});


router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar createdAt');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const profileData = user.toObject();
    profileData.profilePictureUrl = `/api/users/${user._id}/profile-picture`;
    
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
