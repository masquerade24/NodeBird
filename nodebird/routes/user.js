const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { addFollowing } = require('../controllers/user');

const router = express.Router();

// POST /user/:id/follow 라우터이다. :id 부분이 req.params.id가 된다.
router.post('/:id/follow', isLoggedIn, addFollowing);

module.exports = router;