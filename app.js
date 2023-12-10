const express = require('express');
const app = express();
const port = 3003;
const middleware = require('./middleware');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database');
const session = require('express-session');
const axios = require("axios").default;
const _ = require('lodash');
const Jimp = require('jimp');


const server = app.listen(port, () => {
    console.log("Server is listening to " + port);
});

const io = require("socket.io")(server, { pingTimeout: 60000 });


app.use(session({
    secret: "i am batman",
    resave: true,
    saveUninitialized: false
}));

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended:false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));
app.use('/uploads', express.static('/uploads'));
app.use('/templates', express.static(path.join(__dirname, '/uploads/templates')));
app.use(express.json());

app.get("/", middleware.requireLogin, (req, res, next) => {

    var payload = {
        pageTitle: "DevMemes Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }

    res.status(200).render("home", payload);
})


// routes 

const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logout');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const notificationRoute = require('./routes/notificationRoutes');
const threadRoute = require('./routes/threadRoutes');
const memeRoute = require('./routes/memesRoutes');

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/logout', logoutRoute);
app.use('/posts', middleware.requireLogin, postRoute);
app.use('/profile', middleware.requireLogin, profileRoute);
app.use('/uploads/', uploadRoute);
app.use('/search', searchRoute);
app.use('/messages', middleware.requireLogin, messagesRoute);
app.use('/notifications', middleware.requireLogin, notificationRoute);
app.use('/threads', middleware.requireLogin, threadRoute);
app.use('/memes', middleware.requireLogin, memeRoute);


// api routes

const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require("./routes/api/chats");
const messagesApiRoute = require("./routes/api/messages");
const notificationsApiRoute = require('./routes/api/notifications');
const threadsApiRoute = require('./routes/api/threads');

app.use('/api/posts', postsApiRoute);
app.use('/api/users', usersApiRoute);
app.use('/api/chats', chatsApiRoute);
app.use('/api/messages', messagesApiRoute);
app.use('/api/notifications', notificationsApiRoute);
app.use('/api/threads', threadsApiRoute);


// socket.io 

io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    })

    socket.on("join room", room => socket.join(room));
    socket.on("typing", room => socket.in(room).emit("typing"));
    socket.on("stop typing", room => socket.in(room).emit("stop typing"));

    socket.on("new message", newMessage => {

        var chat = newMessage.chat;
        if (!chat.users) return console.log("users.chat not found");

        chat.users.forEach((user) => {
            if (user._id == newMessage.sender._id) return;
            socket.in(user._id).emit("message received", newMessage);
        })

    });

})