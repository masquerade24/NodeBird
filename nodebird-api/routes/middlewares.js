const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent('로그인한 상태입니다.');
        res.redirect(`/?error=${message}`);
    }
};

exports.verifyToken = (req, res, next) => {
    try { // 인증에 성공하면 토큰의 내용이 반환 req.decoded에 저장된다.
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) { // 토크의 비밀키가 일치하지 않는다면 인증에 실패한다.
        if (error.name === 'TokenExpiredError') { // 올바른 토큰이더라도 유효 기간이 지난 경우라면 419(400번대 아무거나 상관없음) 상태 코드를 응답한다.
            return res.status(419).json({
                code: 419,
                message: '토큰이 만료되었습니다',
            });
        }
        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다.',
        });
    }
};

exports.apiLimiter = new RateLimit({
    windowMs: 60 * 1000, // 기준 시간 (1분)
    max: 1, // 허용 횟수
    delayMs: 0, // 호출 간격
    handler(req, res) { // 제한 초과 시 콜백 함수
        res.status(this.statusCode).json({
            code: this.statusCode, // 기본값 429
            message: '1분에 한 번만 요청할 수 있습니다.',
        });
    },
});

exports.deprecated = (req, res) => { // 사용하면 안 되는 라우터에 붙여줄 것.
    res.status(410).json({
        code: 410,
        message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
    });
};