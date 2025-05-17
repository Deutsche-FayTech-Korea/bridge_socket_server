const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // 헤더에서 JWT 추출
    
    if (!token) {
        return next(new AppError('토큰 없음', 400));
    }
    
    try {
        const decodeJwt = jwt.decode(token);
        if (!decodeJwt) {
            return next(new AppError('토큰 decode 불가능', 400));
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodeJwt.exp < currentTime) {
            return next(new AppError('토큰 유효시간 지남', 401));
        }

        // 검증된 토큰 정보를 request 객체에 저장
        const userId = decodeJwt.userId;
        req.user = { userId };
        next();
    } catch (error) {
        return next(new AppError('서버 내부 에러', 500));
    }
};

module.exports = verifyToken;