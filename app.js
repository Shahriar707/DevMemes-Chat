const express = require('express');
const app = express();
const port = 3003;
const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database');
const session = require('express-session');

const server = app.listen(port, () => {
    console.log("Server is listening to " + port);
});

app.use(session({
    secret: "i am batman",
    resave: true,
    saveUninitialized: false
}));

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended:false }));
app.use(express.static(path.join(__dirname, "public")));


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

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/logout', logoutRoute);
app.use('/posts', middleware.requireLogin, postRoute);
app.use('/profile', middleware.requireLogin, profileRoute);
app.use('/uploads/', uploadRoute);
app.use('/search', searchRoute);

// api routes

const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');

app.use('/api/posts', postsApiRoute);
app.use('/api/users', usersApiRoute);