const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

describe('isLoggedIn', () => { // describe는 테스트를 그룹화 해준다. 1번 인수: 그룹에 대한 설명, 2번 인수(함수): 그룹에 대한 내용
    const res = {
        status: jest.fn(() => res), // res.status(403).send('hello') 처럼 메서드 체이닝이 가능해야하므로 res를 반환.
        send: jest.fn(),
    };
    const next = jest.fn();
    test('로그인되어 있으면 isLoggedIn이 next를 호출해야 함', () => {
        const req = {
            isAuthenticated: jest.fn(() => true), // 로그인 여부를 알려주는 함수 (ture나 false를 반환)
        };
        isLoggedIn(req, res, next);
        expect(next).toBeCalledTimes(1); // 몇 번 호출되었는지를 체크, toBeCalledWith(인수)는 특정 인수와 함께 호출되었는지를 체크
    });

    test('로그인되어 있지 않으면 isLoggedIn이 에러를 응답해야 함', () => {
        const req = {
            isAuthenticated: jest.fn(() => false),
        };
        isLoggedIn(req, res, next);
        expect(res.status).toBeCalledWith(403);
        expect(res.send).toBeCalledWith('로그인 필요');
    });
});

describe('isNotLoggedIn', () => {
    const res = {
        redirect: jest.fn(),
    };
    const next = jest.fn();

    test('로그인되어 있으면 isNotLoggedIn이 에러를 응답해야 함', () => {
        const req = {
            isAuthenticated: jest.fn(() => true),
        };
        isNotLoggedIn(req, res, next);
        const message = encodeURIComponent('로그인한 상태입니다.');
        expect(res.redirect).toBeCalledWith(`/?error=${message}`);
    });

    test('로그인되어 있지 않으면 isNotLoggedIn이 next를 호출해야 함', () => {
        const req = {
            isAuthenticated: jest.fn(() => false),
        };
        isNotLoggedIn(req, res, next);
        expect(next).toBeCalledTimes(1);
    });
});