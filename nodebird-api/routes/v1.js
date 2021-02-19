const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

// GET /v1/test 토큰을 테스트해볼 수 있는 라우터
router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});

// POST /v1/token 토큰을 발급하는 라우터
router.post('/token', async (req, res) => {
    const { clientSecret } = req.body;
    try { // 전달받은 클라이언트 비밀키로 도메인이 등록된 것인지 확인한다.
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if (!domain) { // 도메인이 등록된 것이 아니라면
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        } // 도메인이 등록된 것이라면 jwt.sign으로 토큰을 발급받는다. 
        const token = jwt.sign({ // jwt.sign(토큰의 내용, 비밀키, 토큰의 설정)
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '1m', // 1분
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

// GET /posts/my 라우터. 내가 올린 게시글을 가져온다.
router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({ where: { userId: req.decoded.id } })
        .then((posts) => {
            console.log(posts);
            res.json({
                code: 200,
                payload: posts,
            });
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({
                code: 500,
                message: '서버 에러',
            });
        });
});

//GET /posts/hashtag/:title 라우터. 해시태그 검색 결과를 가져온다.
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if (!hashtag) {
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

module.exports = router;