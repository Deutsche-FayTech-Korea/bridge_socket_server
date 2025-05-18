const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

// 소켓 연결용 JWT 검증 함수
const verifyJwtToken = (token) => {
    if (!token) {
        throw new AppError('토큰 없음', 400);
    }
    
    try {
        const decoded = jwt.decode(token);
        if (!decoded) {
            throw new AppError('토큰 decode 불가능', 400);
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
            throw new AppError('토큰 유효시간 지남', 401);
        }

        return decoded.userId;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('서버 내부 에러', 500);
    }
};

// HTTP 요청용 JWT 검증 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    
    if (!token) {
        return next(new AppError('토큰 없음', 400));
    }
    
    try {
        const decoded = jwt.decode(token);
        if (!decoded) {
            return next(new AppError('토큰 decode 불가능', 400));
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
            return next(new AppError('토큰 유효시간 지남', 401));
        }

        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError('서버 내부 에러', 500));
    }
};

// 미들웨어 함수를 직접 내보내고, verifyJwtToken은 별도로 내보냄
module.exports = verifyToken;
module.exports.verifyJwtToken = verifyJwtToken;