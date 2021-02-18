const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // GET / 500 16.365ms - 1364 Package for checking executing time
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks'); // For template engine
const dotenv = require('dotenv'); // Can use .env file
const passport = require('passport');

dotenv.config(); // Load the .env file to use environment variable.
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express(); // Creates an Express application.
passportConfig(); // Set the passport.
app.set('port', process.env.PORT || 8001); // Set a port number to process.env.PORT. if it is false, set to 8001.
app.set('view engine', 'html'); // Set a view engine to 'html'.
nunjucks.configure('views', {
    express: app,
    watch: true,
});
sequelize.sync({ force: false })
    .then(() => {
        console.log('DB 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

app.use(morgan('dev')); // Use the middleware with 'app.use(mw)'.
app.use(express.static(path.join(__dirname, 'public'))); // Provide a static files(like front.html) in a folder path. if no static files, execute next().
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()); // It parses incoming requests with JSON payloads and is based on body-parser
// body-parser interpret a req.data(request body's data) and make it req.body.
app.use(express.urlencoded({ extended: false })); // true: use qs(npm) module, false: use querystring(node) module.
app.use(cookieParser(process.env.COOKIE_SECRET)); // Interpret cookies enclosed in request and make it req.cookies.
app.use(session({ // req.session store this session temporarily.
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter); // Execute pageRouter when request is '/'.
app.use('/auth', authRouter); // Execute authRouter when request is '/auth'.
app.use('/post', postRouter);
app.use('/user', userRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`); // 'GET /hahahoho 라우터가 없습니다.'
    error.status = 404;
    next(error); // Move to error handler.
})
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {}; // If you want to set an environment variable, input SET NODE_ENV=development
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});