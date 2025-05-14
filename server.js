require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const roomRoutes = require('./output/routes/room/room.routes');
const jwt = require('jsonwebtoken');
const { errorHandler, logUtils } = require('./common/error/errorHandler');

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use(logUtils.logRequest);
app.use(logUtils.logResponse);

// 임시 JWT 토큰 생성 엔드포인트
app.post('/api/auth/token', (req, res) => {
    const token = jwt.sign(
        { userId: 'test-user', role: 'user' },
        'your-secret-key',  // 실제 프로덕션에서는 환경 변수로 관리해야 합니다
        { expiresIn: '1h' }
    );
    res.json({ token });
});

// API 라우트 설정
app.use('/api/room', roomRoutes);

// 정적 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/socket.html');
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('사용자가 연결되었습니다.');

    socket.on('disconnect', () => {
        console.log('사용자가 연결을 해제했습니다.');
    });
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

// 서버 시작
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 