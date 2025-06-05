const { Server } = require('socket.io');
const { logger, AppError } = require('../common/error/errorHandler');
const jwt = require('jsonwebtoken');
const { verifyJwtToken } = require('../common/error/jwt');
const Redis = require('redis');

let io; // io 인스턴스를 전역 변수로 선언
let redisClient;
let redisSubscriber;

// Redis 클라이언트 초기화 함수
async function initializeRedis() {
  try {
    redisClient = Redis.createClient({ 
        url: 'redis://localhost:6379',
        database: 0, // 기본 데이터베이스
        socket: {
            reconnectStrategy: (retries) => {
                return Math.min(retries * 50, 2000);
            }
        }
    });
    
    redisSubscriber = Redis.createClient({ 
        url: 'redis://localhost:6379',
        database: 0,
        socket: {
            reconnectStrategy: (retries) => {
                return Math.min(retries * 50, 2000);
            }
        }
    });

    redisClient.on('connect', () => console.log('✅ Redis 클라이언트 연결됨'));
    redisSubscriber.on('connect', () => console.log('✅ Redis 구독자 연결됨'));

    redisClient.on('error', (err) => console.error('❌ Redis 클라이언트 에러:', err));
    redisSubscriber.on('error', (err) => console.error('❌ Redis 구독자 에러:', err));

    await redisClient.connect();
    await redisSubscriber.connect();

    // Redis 구독 설정 - room별 채널 구독
    redisSubscriber.subscribe('socket-messages', (message) => {
        try {
            const data = JSON.parse(message);
            const { roomId, event, payload } = data;
            
            if (roomId && event) {
                // roomId를 키로 사용하여 데이터 저장
                const roomKey = `room:${roomId}`;
                
                // 이벤트 데이터를 room별로 저장
                redisClient.hSet(roomKey, event, JSON.stringify({
                    ...payload,
                    timestamp: new Date().toISOString()
                }));

                // 해당 room의 클라이언트들에게만 이벤트 전송
                io.to(roomId).emit(event, payload);
            }
        } catch (error) {
            logger.error('Redis 메시지 처리 실패', { error: error.message });
        }
    });

    console.log('✅ Redis 초기화 완료');
  } catch (error) {
    console.error('❌ Redis 초기화 실패:', error.message);
    throw error;
  }
}

function socketConnect(server) {
    // Socket.IO 초기화
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
        },
        path: '/socket.io/',
        transports: ['websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Redis 초기화
    initializeRedis().catch(err => {
        logger.error('Redis 초기화 실패', { error: err.message });
    });

    // 연결 이벤트 처리
    io.on('connection', (socket) => {
        logger.info('새로운 연결 시도', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });

        // 토큰 검증
        const cookie = socket.handshake.headers.cookie;
        logger.info('쿠키', {
            cookie: cookie
        });

        if (!cookie) {
            logger.error('쿠키가 없음', {
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
            throw new AppError('인증 정보가 없습니다', 401);
        }

        // access_token 추출
        const accessToken = cookie.split(';')
            .find(c => c.trim().startsWith('access_token='))
            ?.split('=')[1];

        if (!accessToken) {
            logger.error('access_token이 없음', {
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
            throw new AppError('인증 토큰이 없습니다', 401);
        }

        try {
            const userId = verifyJwtToken(accessToken);
            socket.userId = userId;
            logger.info('토큰 검증 성공', {
                socketId: socket.id,
                userId: userId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('토큰 검증 실패', {
                socketId: socket.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            socket.disconnect(true);
            return;
        }

        // 방 참가 이벤트
        socket.on('joinRoom', ({roomId}) => {
            try {

                socket.join(roomId);
                
                // 방에 있는 모든 소켓 정보 가져오기
                const roomSockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                const roomParticipants = roomSockets.map(socketId => ({
                    socketId,
                    isNewJoiner: socketId === socket.id
                }));

                logger.info('방 참가', { 
                    roomId,
                    socketId: socket.id,
                    userId: socket.userId,
                    timestamp: new Date().toISOString(),
                    roomParticipants: roomParticipants
                });
            
                // 방에 있는 다른 사용자들에게 새 참가자 알림
                socket.to(roomId).emit('userJoined', {
                    userId: socket.userId,
                    socketId: socket.id,
                    timestamp: new Date()
                });
            } catch (error) {
                logger.error('방 참가 실패', { 
                    roomId,
                    socketId: socket.id,
                    userId: socket.userId,
                    error: error.message
                });
            }
        });

        //그리기 이벤트 - 클라이언트 -> 서버 받았을 때
        socket.on('drawLine', ({roomId, data}) => {
            try {
                if (!roomId || !data) {
                    logger.error('잘못된 그리기 데이터', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    throw new AppError('잘못된 그리기 데이터입니다', 400);
                }
                
                io.to(roomId).emit('drawLine', {
                    data,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });

                // 로깅은 서버에서만
                logger.info('그리기 이벤트 전송', {
                    roomId,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('그리기 이벤트 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message
                });
            }
        });

        //이미지 보낼 때 이벤트
        socket.on('sendImage', ({roomId, data}) => {
            try {
                if (!roomId || !data) {
                    logger.error('이미지 데이터가 없습니다', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '이미지 데이터가 없습니다' });
                    return;
                }

                // 이미지 데이터 검증
                if (typeof data !== 'string' || !data.startsWith('data:image/')) {
                    logger.error('잘못된 이미지 형식', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '잘못된 이미지 형식입니다' });
                    return;
                }

                // 이미지 크기 제한 (예: 5MB)
                const base64Data = data.split(',')[1];
                const imageSize = Math.ceil((base64Data.length * 3) / 4);
                if (imageSize > 5 * 1024 * 1024) {
                    logger.error('이미지 크기 초과', {
                        roomId,
                        socketId: socket.id,
                        size: imageSize,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '이미지 크기는 5MB를 초과할 수 없습니다' });
                    return;
                }

                io.to(roomId).emit('sendImage', {
                    data,
                    socketId: socket.id,
                    timestamp: new Date().toISOStrding()
                });

                logger.info('이미지 전송 완료', {
                    roomId,
                    socketId: socket.id,
                    size: imageSize,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('이미지 전송 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('error', { message: '이미지 전송 중 오류가 발생했습니다' });
            }
        });

        

        //커서 위치 받았을 때 이벤트
        socket.on('sendCursorPosition', ({roomId, data}) => {
            try {
                if (!roomId || !data) {
                    logger.error('잘못된 커서 위치 데이터', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    throw new AppError('잘못된 커서 위치 데이터입니다', 400);
                }
                
                io.to(roomId).emit('sendCursorPosition', {
                    data,
                    socketId: socket.id,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });

                logger.info('커서 위치 받았을 때 이벤트', {
                    roomId,
                    socketId: socket.id,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                logger.error('커서 위치 보내기 이벤트 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message
                });
            }
        });

        // 방 나가기 이벤트
        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            logger.info('방 나가기', { 
                roomId,
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });

            // 방에 있는 다른 사용자들에게 퇴장 알림
            socket.to(roomId).emit('userLeft', {
                userId: socket.userId,
                socketId: socket.id,
                timestamp: new Date()
            });
        });

        // 1. Base64 방식
        socket.on('sendFileBase64', ({roomId, data, fileName, fileType}) => {
            try {
                if (!roomId || !data) {
                    logger.error('이미지 데이터가 없습니다', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '이미지 데이터가 없습니다' });
                    return;
                }

                // 이미지 데이터 검증
                if (typeof data !== 'string' || !data.startsWith('data:image/')) {
                    logger.error('잘못된 이미지 형식', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '잘못된 이미지 형식입니다' });
                    return;
                }

                io.to(roomId).emit('receiveFileBase64', {
                    data,
                    fileName,
                    fileType,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });

                logger.info('Base64 파일 전송 완료', {
                    roomId,
                    socketId: socket.id,
                    fileName,
                    fileType,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('Base64 파일 전송 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('error', { message: '파일 전송 중 오류가 발생했습니다' });
            }
        });

        // 2. 바이너리 방식
        socket.on('sendFileBinary', ({roomId, data, fileName, fileType}) => {
            try {
                if (!roomId || !data || !fileName) {
                    logger.error('잘못된 파일 데이터', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '파일 데이터가 없습니다' });
                    return;
                }

                // Buffer 데이터 검증
                if (!Buffer.isBuffer(data)) {
                    logger.error('잘못된 파일 형식', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '잘못된 파일 형식입니다' });
                    return;
                }

                // 파일 크기 제한 (예: 10MB)
                if (data.length > 10 * 1024 * 1024) {
                    logger.error('파일 크기 초과', {
                        roomId,
                        socketId: socket.id,
                        size: data.length,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '파일 크기는 10MB를 초과할 수 없습니다' });
                    return;
                }

                io.to(roomId).emit('receiveFileBinary', {
                    data,
                    fileName,
                    fileType,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });

                logger.info('바이너리 파일 전송 완료', {
                    roomId,
                    socketId: socket.id,
                    fileName,
                    fileType,
                    size: data.length,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('바이너리 파일 전송 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('error', { message: '파일 전송 중 오류가 발생했습니다' });
            }
        });

        // 3. Redis pub/sub 방식
        socket.on('sendFileRedis', async ({roomId, data, fileName, fileType}) => {
            try {
                if (!roomId || !data || !fileName) {
                    logger.error('잘못된 파일 데이터', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '파일 데이터가 없습니다' });
                    return;
                }

                // 파일 크기 제한 (10MB)
                const fileSize = Buffer.from(data).length;
                if (fileSize > 10 * 1024 * 1024) {
                    logger.error('파일 크기 초과', {
                        roomId,
                        socketId: socket.id,
                        size: fileSize,
                        timestamp: new Date().toISOString()
                    });
                    socket.emit('error', { message: '파일 크기는 10MB를 초과할 수 없습니다' });
                    return;
                }

                // 파일 메타데이터 저장
                const fileKey = `room:${roomId}:file:${fileName}`;
                const fileMetadata = {
                    fileName,
                    fileType,
                    fileSize,
                    senderId: socket.id,
                    timestamp: new Date().toISOString()
                };

                // 파일 데이터를 청크로 나누어 저장
                const CHUNK_SIZE = 1024 * 1024; // 1MB 청크
                const chunks = Math.ceil(fileSize / CHUNK_SIZE);
                
                // 메타데이터 저장
                await redisClient.hSet(fileKey, 'metadata', JSON.stringify(fileMetadata));
                
                // 청크 데이터 저장
                for (let i = 0; i < chunks; i++) {
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, fileSize);
                    const chunk = data.slice(start, end);
                    
                    await redisClient.hSet(fileKey, `chunk:${i}`, chunk);
                }

                // Redis에 파일 전송 이벤트 발행
                const message = JSON.stringify({
                    roomId,
                    event: 'receiveFileRedis',
                    payload: {
                        fileName,
                        fileType,
                        fileSize,
                        chunks,
                        senderId: socket.id,
                        timestamp: new Date().toISOString()
                    }
                });

                await redisClient.publish('socket-messages', message);

                logger.info('Redis를 통한 파일 전송 완료', {
                    roomId,
                    socketId: socket.id,
                    fileName,
                    fileType,
                    size: fileSize,
                    chunks,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('Redis 파일 전송 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('error', { message: '파일 전송 중 오류가 발생했습니다' });
            }
        });

        // 연결 해제 이벤트
        socket.on('disconnect', () => {
            logger.info('연결 해제', { 
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io;
}

function connectToRoom(roomId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io.in(roomId);
}

function disconnectFromRoom(roomId, socketId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(roomId);
    }
}

module.exports = {
    initializeRedis,
    socketConnect,
    getIO,
    connectToRoom,
    disconnectFromRoom
};


