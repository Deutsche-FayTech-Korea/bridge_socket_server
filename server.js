require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { privateSocketConnect } = require('./socket/privateSocket');
const { publicSocketConnect } = require('./socket/publicSocket');
const roomRoutes = require('./routes/room/room.routes');
const jwt = require('jsonwebtoken');
const { errorHandler, logUtils } = require('./common/error/errorHandler');
const verifyToken = require('./common/error/jwt');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// CORS 설정
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// 쿠키 설정 미들웨어
app.use((req, res, next) => {
    if (req.cookies.access_token) {
        res.cookie('access_token', req.cookies.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24시간
        });
    }
    next();
});

// 로깅 미들웨어
app.use(logUtils.logRequest);
app.use(logUtils.logResponse);

// API 라우트 설정
app.use('/api/room', verifyToken, roomRoutes);

// 정적 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/socket.html');
});

// 퍼블릭 라우트
app.get('/public', (req, res) => {
    res.sendFile(__dirname + '/public-socket.html');
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
const privateIo = privateSocketConnect(http);
const publicIo = publicSocketConnect(http);

// 서버 시작
const PORT = process.env.PORT || 8000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📡 프라이빗 소켓 서버가 시작되었습니다.`);
    console.log(`📡 퍼블릭 소켓 서버가 시작되었습니다.`);
    console.log('=================================');
}); 