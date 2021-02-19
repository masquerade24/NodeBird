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
nunjucks.configure('views', { // 넌적스의 configure 메서드의 1번 인수로 views 폴더의 경로를 넣고, 두 번째 인수로 옵션을 넣는다.
    express: app, // 이때 express 속성에 app 객체를 연결한다.
    watch: true, // watch 옵션이 true이면 HTML 파일이 변경될 때 템플릿 엔진을 다시 렌더링한다.
});
sequelize.sync({ force: false }) // force가 true이면 서버 실행 시마다 테이블을 재생성한다.
    .then(() => {
        console.log('DB 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

app.use(morgan('dev')); // Use the middleware with 'app.use(mw)'.
app.use(express.static(path.join(__dirname, 'public'))); // Provide a static files(like front.html) in a folder path. if no static files, execute next().
app.use('/img', express.static(path.join(__dirname, 'uploads'))); // static 미들웨어가 /img 경로의 정적 파일들을 제공한다. (클라이언트에서 접근이 가능해진다.)
app.use(express.json()); // 이것은 JSON 페이로드와 들어오는 요청을 파싱한다. 이것은 body-parser에 기반을 둔다.
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
app.use(passport.initialize()); // 요청(req)에 passport 설정을 심는다.
app.use(passport.session()); // req.session 객체에 passport 정보를 저장한다.

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
    console.log(`스색`);
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {}; // If you want to set an environment variable, input SET NODE_ENV=development
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});