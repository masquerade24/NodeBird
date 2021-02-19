const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// POST /auth/join
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, nick, password } = req.body; // req.body 객체에 있는 키 email, nick, password의 값을 각각 변수 email, nick, password에 저장.
    try {
        const exUser = await User.findOne({ where: { email } }); // 이메일이 존재하는 유저를 exUser에 등록
        if (exUser) {
            return res.redirect('/join?error=exist'); // exUser가 있으면 query가 error=exist인 곳으로 리다이렉트
        } // 같은 이메일로 가입한 사용자가 없으면
        const hash = await bcrypt.hash(password, 12); // 비밀번호 암호화
        await User.create({ // User 모델에 튜플 생성
            email, // email: email
            nick, // nick: nick
            password: hash, // password = hash
        });
        return res.redirect('/'); // 생성 후 원래 페이지로 리다이렉트
    } catch (error) { // POST /join에 오류가 발생하면
        console.error(error);
        return next(error); // 에러 핸들러로 이동
    }
});

// POST /auth/login 왜 앞에 /auth가 붙냐? main.html에 가보면 '로그인' 버튼에 
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => { // 로컬 로그인 전략 수행. passport-local. 로컬 전략의 done 함수와 교과서 참고할 것
      if (authError) { // 오류가 발생한 경우
        console.error(authError);
        return next(authError);
      }
      if (!user) { // 오류가 발생하지 않았지만 등록된 user가 없는 경우.
        return res.redirect(`/?loginError=${info.message}`);
      }
      return req.login(user, (loginError) => {
        if (loginError) {
          console.error(loginError);
          return next(loginError);
        }
        return res.redirect('/');
      });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
  });
  
  // GET /auth/logout
  router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
  });
  
  router.get('/kakao', passport.authenticate('kakao'));
  
  router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
  }), (req, res) => {
    res.redirect('/');
  });
  
  module.exports = router;