const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');

app.use(bodyParser.urlencoded({ extended:false }));

router.get('/', async (req, res, next) => {

    var searchObj = req.query;

    if (searchObj.isReply !== undefined) {
        var isReply = searchObj.isReply == "true";
        searchObj.replyTo = { $exists: isReply };
        delete searchObj.isReply;
    }

    if (searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" };
        delete searchObj.search;
    }

    if (searchObj.followingOnly !== undefined) {
        var followingOnly = searchObj.followingOnly == "true";
        
        if (followingOnly) {
            var objectIds = [];
            if(!req.session.user.following) {
                req.session.user.following = [];
            }
            req.session.user.following.forEach((user) => {
                objectIds.push(user);
            })
            objectIds.push(req.session.user._id);
            searchObj.postedBy = { $in: objectIds };
        }
        delete searchObj.followingOnly;
    }

    var results = await getPosts(searchObj);
    return res.status(200).send(results);
});


router.post('/', async (req, res, next) => {

    if (!req.body.content) {
        console.log("Content param are not defined");
        res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user,
    }

    if (req.body.replyTo) {
        postData.replyTo = req.body.replyTo;
    } 

  
    Post.create(postData)
    .then(async (newPost) => {
        newPost = await User.populate(newPost, { path: "postedBy" });
        newPost = await Post.populate(newPost, { path: "replyTo" });

        if (newPost.replyTo !== undefined) {
            await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
        }

        res.status(201).send(newPost);
    })
    .catch((error) => {
        console.log(error);
        res.sendStatus(400);
    })



});

async function getPosts(filter) {
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("shareData")
    .populate("replyTo")
    .sort({ "createdAt": -1 })
    .catch((error) => { console.log(error); })
    
    results = await User.populate(results, { path:"replyTo.postedBy" });

    return await User.populate(results, { path:"shareData.postedBy" })
};


module.exports = router; 