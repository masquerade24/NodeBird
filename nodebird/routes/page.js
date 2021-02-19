const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: '뀨뀨 내 정보 - NodeBird' });
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '뀨뀨 회원가입 - NodeBird' });
});

// GET / 메인 페이지 라우터이다.
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({ // DB에서 게시글을 조회한다. User모델의 id와 nick을 JOIN한다. 생성일시에 내림차순(최신순)으로 정렬한다.
      include: {
        model: User,
        attributes: ['id', 'nick'], // id와 nick을 가져오는데.. id는 왜 가져왔을까?
      },
      order: [['createdAt', 'DESC']], // 생성날짜에 내림차순 = 최신순으로 정렬
    });
    res.render('main', { // 'main' 뷰에 데이터로 title에는 NodeBird를 넣고, twits에는 조회한 게시글들을 넣는다.
      title: '뀽NodeBird', // 크롭 탭에 나오는 이름
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// GET /hashtag 라우터이다.
router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag; // 쿼리스트링으로 해시태그 이름을 받는다.
  if (!query) { // 해시태그 값이 없는 경우 메인 페이지로 돌려 보낸다(리다이렉트).
    return res.redirect('/');
  }
  try { // 해시태그가 있다면
    const hashtag = await Hashtag.findOne({ where: { title: query } }); // Hashtag 릴레이션에서 이름이 query랑 일치하는 것을 찾는다.
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] }); // 그리고 getPosts 메서드로 모든 게시글을 가져온다.
    }

    return res.render('main', { // 조회 후 메인 페이지를 렌더링하면서 전체 게시글 대신 조회된 게시글만 twits에 넣어 렌더링한다.
      title: `${query} | 뀽NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;