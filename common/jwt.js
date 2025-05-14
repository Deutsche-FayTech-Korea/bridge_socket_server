const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // 헤더에서 JWT 추출
    
    try {
        const decodeJwt = jwt.decode(token);
        if (!decodeJwt) {
            return res.status(400).json({ message: "토큰 decode 불가능" });
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodeJwt.exp < currentTime) {
            return res.status(401).json({ message: "토큰 유효시간 지남" });
        }

        // 검증된 토큰 정보를 request 객체에 저장
        req.user = decodeJwt;
        next();
    } catch (error) {
        return res.status(500).json({ message: "서버 내부 에러" });
    }
};

module.exports = verifyToken;