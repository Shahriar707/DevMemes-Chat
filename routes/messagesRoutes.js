const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');
const { ObjectId } = require('mongodb');

router.get('/', (req, res, next) => {

    var payload = {
        pageTitle: "Inbox",
        userLoggedIn: req.session.user, 
        userLoggedInJs: JSON.stringify(req.session.user), 
    };
    
    res.status(200).render("inboxPage", payload);
});


router.get('/new', (req, res, next) => {

    var payload = {
        pageTitle: "New Messages",
        userLoggedIn: req.session.user, 
        userLoggedInJs: JSON.stringify(req.session.user), 
    };
    
    res.status(200).render("newMessages", payload);
});

router.get('/:chatId', async (req, res, next) => {

    var userId = req.session.user._id;
    var chatId = req.params.chatId;
    var isValidId = mongoose.isValidObjectId(chatId);

    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user, 
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    if (!isValidId) {
        payload.errorMessage = "Chat doesn't exist at this moment";
        return res.status(200).render("chatPage", payload);
    }

    var chat = await Chat.findOne({ _id:chatId, users: { $elemMatch: { $eq: userId } } })
    .populate("users")

    if (chat == null) {
        // if chatId == userId
        var userFound = await User.findById(chatId);

        if (userFound != null) {
            // get chat using userId
            chat = await getChatByUserId(userFound, userId);
        }
    }

    if (chat == null) {
        payload.errorMessage = "Chat doesn't exist at this moment";
    } else {
        payload.chat = chat;
    }
    
    res.status(200).render("chatPage", payload);
});


function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                { $elemMatch: { $eq: new mongoose.Types.ObjectId(userLoggedInId) } },
                { $elemMatch: { $eq: new mongoose.Types.ObjectId(otherUserId) } }
            ]
        }
    }, 
    {
        $setOnInsert: {
            users: [userLoggedInId, otherUserId]
        }
    }, 
    {
        new: true,
        upsert: true
    })
    .populate("users")
}

module.exports = router;