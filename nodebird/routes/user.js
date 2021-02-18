const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// POST /user/:id/follow 라우터이다. :id 부분이 req.params.id가 된다.
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id } }); // User 릴레이션에서 id가 req.user.id와 일치하는 유저를 찾는다.
        if (user) { // 만약 그런 유저가 있다면 Following에 추가한다.
            await user.addFollowing(parseInt(req.params.id, 10));
            res.send('success');
        } else {
            res.status(404).send('no user :(');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;