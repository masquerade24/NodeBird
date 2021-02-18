const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({ // storage 속성과 limits 속성 설정을 인수로 넣는다. 
    // storage 속성에는 destination에 어떤 filename으로 저장할지를 넣는다. cb의 1번 인수는 에러 시 수행할 것, 2번 인수는 실제 경로나 파일 이름을 넣어준다.
    // req나 file의 데이터를 가공해서 cb로 넘기는 형식이다.
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname); // path.extname은 확장자명
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext); // path.basename은 파일이름.
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /post/img 라우터 (이미지 업로드)
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => { // 로그인된 상태에서, 이미지 업로드 받고, 이미지 저장 경로를 응답한다.
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
//POST /post 라우터 (게시글 업로드를 처리)
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => { // 로그인된 상태에서, 업로드 받은 이미지의 데이터(req.body)를 Post 릴레이션에 추가
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        const hashtags = req.body.content.match(/#[^\s#]+/g); // 해시태그를 정규표현식(/#[^\s#]+/g)로 추출한다.
        if (hashtags) { // 추출한 해시태그를 DB에 저장한다.
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({ // findOrCreate의 반환 형식은 [모델, 생성 여부]
                        where: { title: tag.slice(1).toLowerCase() },
                    })
                }),
            );
            await post.addHashtags(result.map(r => r[0]));
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;