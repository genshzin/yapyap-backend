const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    sendRequest,
    acceptRequest,
    declineRequest,
    deleteFriendship,
    listFriends,
    listRequests
} = require('../controllers/friendshipController');

const router = express.Router();

router.post('/send', authenticateToken, sendRequest);
router.post('/accept', authenticateToken, acceptRequest);
router.post('/decline', authenticateToken, declineRequest);
router.delete('/delete/:friendId', authenticateToken, deleteFriendship); // Updated to use URL parameter
router.get('/friends', authenticateToken, listFriends);
router.get('/requests', authenticateToken, listRequests);

module.exports = router;