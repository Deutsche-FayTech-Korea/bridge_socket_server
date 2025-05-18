require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { socketConnect } = require('./socket/socket');
const roomRoutes = require('./output/routes/room/room.routes');
const jwt = require('jsonwebtoken');
const { errorHandler, logUtils } = require('./common/error/errorHandler');
const verifyToken = require('./common/error/jwt');
const cookieParser = require('cookie-parser');

// CORS 설정
app.use((req, res, next) => {
    // 특정 도메인에서의 요청만 허용
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 로깅 미들웨어
app.use(logUtils.logRequest);
app.use(logUtils.logResponse);

// 임시 JWT 토큰 생성 엔드포인트
app.post('/api/auth/token', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'userId는 필수입니다.'
        });
    }
    console.log(userId,"는 다음과 같습니다");
    const token = jwt.sign(
        { userId, role: 'user' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );
    res.json({ token });
});

// API 라우트 설정
app.use('/api/room', verifyToken, roomRoutes);

// 정적 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/socket.html');
});

// 404 에러 핸들러
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        status: 'fail',
        message: '요청한 리소스를 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
    });
});

// 에러 핸들러 미들웨어 (반드시 마지막에 위치해야 함)
app.use(errorHandler);

// 소켓 서버 초기화
socketConnect(http);

// 서버 시작
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📡 소켓 서버가 시작되었습니다.`);
    console.log('=================================');
}); 