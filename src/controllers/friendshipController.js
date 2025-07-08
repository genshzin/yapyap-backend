const User = require('../models/User');
const Friendship = require('../models/Friendship');

const sendRequest = async function(req, res) {
    try{ 
        const requesterId = req.user.id;
        const recipientId = req.body.recipientId;
        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient ID is required' });
        }
        if (requesterId === recipientId) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }
        
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ error: 'User not found' });
        }
        const existingRequest = await Friendship.findOne({
           $or: [
                { requester: requesterId, recipient: recipientId, status: 'pending' },
                { requester: recipientId, recipient: requesterId, status: 'pending' }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }
        const existingFriendship = await Friendship.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId, status: 'accepted' },
                { requester: recipientId, recipient: requesterId, status: 'accepted' }
            ]
        });
        if (existingFriendship) {
            return res.status(400).json({ error: 'You are already friends with this user' });
        }

        const friendship = new Friendship({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        });
        await friendship.save();
        res.status(201).json({ message: 'Friend request sent successfully', friendship });

    } catch (error){
        res.status(500).json({ error: 'Server error' });
    }
}

const acceptRequest = async function(req, res) {
    const recipientId = req.user.id;
    const requesterId = req.body.requesterId;

    const friendship = await Friendship.findOne({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
    });

    if (!friendship) {
        return res.status(404).json({ error: 'Friend request not found' });
    }

    friendship.status = 'accepted';
    await friendship.save();
    res.status(200).json({ message: 'Friend request accepted', friendship });
}

const declineRequest = async function(req, res){
    const recipientId = req.user.id;
    const requesterId = req.body.requesterId;

    const friendship = await Friendship.findOne({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
    });

    if (!friendship) {
        return res.status(404).json({ error: 'Friend request not found' });
    }

    friendship.status = 'declined';
    await friendship.save();
    res.status(200).json({ message: 'Friend request declined', friendship });
}

const deleteFriendship = async function(req, res){
    const userId = req.user.id;
    const friendId = req.params.friendId; 

    if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
    }

    try {
        
        const friendshipById = await Friendship.findById(friendId);
        
        if (friendshipById) {
            if (friendshipById.requester.toString() === userId || 
                friendshipById.recipient.toString() === userId) {
                await Friendship.findByIdAndDelete(friendId);
                return res.status(200).json({ message: 'Friendship deleted successfully' });
            } else {
                return res.status(403).json({ error: 'You are not authorized to delete this friendship' });
            }
        }
        
        const friendshipByUsers = await Friendship.findOneAndDelete({
            $or: [
                { requester: userId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: userId, status: 'accepted' }
            ]
        });

        if (friendshipByUsers) {
            return res.status(200).json({ message: 'Friendship deleted successfully' });
        }

        return res.status(404).json({ error: 'Friendship not found' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

const listFriends = async function(req, res) {
    const userId = req.user.id;

    try {
        const friendships = await Friendship.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester recipient', 'username email profilePicture');

        const friendshipsWithUrls = friendships.map(friendship => {
            const friendshipObj = friendship.toObject();
            
            if (friendshipObj.requester && friendshipObj.requester.profilePicture && friendshipObj.requester.profilePicture.data) {
                friendshipObj.requester.profilePictureUrl = `${req.protocol}://${req.get('host')}/api/users/${friendshipObj.requester._id}/profile-picture`;
                delete friendshipObj.requester.profilePicture;
            }
            
            if (friendshipObj.recipient && friendshipObj.recipient.profilePicture && friendshipObj.recipient.profilePicture.data) {
                friendshipObj.recipient.profilePictureUrl = `${req.protocol}://${req.get('host')}/api/users/${friendshipObj.recipient._id}/profile-picture`;
                delete friendshipObj.recipient.profilePicture;
            }
            
            return friendshipObj;
        });

        res.status(200).json(friendshipsWithUrls);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

const listRequests = async function(req, res) {
    const userId = req.user.id;

    try {
        const requests = await Friendship.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'username email profilePicture');

        const requestsWithUrls = requests.map(request => {
            const requestObj = request.toObject();
            
            if (requestObj.requester && requestObj.requester.profilePicture && requestObj.requester.profilePicture.data) {
                requestObj.requester.profilePictureUrl = `${req.protocol}://${req.get('host')}/api/users/${requestObj.requester._id}/profile-picture`;
                delete requestObj.requester.profilePicture;
            }
            
            return requestObj;
        });

        res.status(200).json(requestsWithUrls);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    declineRequest,
    deleteFriendship,
    listFriends,
    listRequests
};
