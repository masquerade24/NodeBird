const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
    passport.use(new KakaoStrategy({
        clientID: process.env.KAKAO_ID, // 카카오에서 발급해주는 아이디. 노출되면 안되므로 .env에 KAKAO_IN로 저장되어 있다.
        callbackURL: '/auth/kakao/callback', // 카카오로부터 인증결과를 받을 라우터 주소이다.
    }, async (accessToken, refreshToken, profile, done) => { // 카카오는 인증 후 callbackURL에 적힌 주소로 accessToken과 refreshToken과 profile을 보낸다.
        console.log('kakao profile', profile);
        try {
            const exUser = await User.findOne({
                where: { snsId: profile.id, provider: 'kakao' }, // 기존에 카카오를 통해 회원가입한 유저가 있는지 찾는다.
            });
            if (exUser) {
                done(null, exUser);
            } else { // 회원가입되어있지 않다면 회원가입을 진행한다. 
                const newUser = await User.create({
                    email: profile._json && profile._json.kakao_account_email, // profile._json이 있으면 profile._json.kakao_account_email로 한다.
                    nick: profile.displayName,
                    snsId: profile.id,
                    provider: 'kakao',
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};