const Redis = require('redis');
const { logger } = require('../common/error/errorHandler');

let redisClient;
let redisSubscriber;

// Redis 클라이언트 초기화 함수
async function initializeRedis(io) {
    try {
        redisClient = Redis.createClient({ 
            url: 'redis://localhost:6379',
            database: 0,
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

        // Redis 구독 설정
        redisSubscriber.subscribe('socket-messages', (message) => {
            try {
                const data = JSON.parse(message);
                const { roomId, event, payload } = data;
                
                if (roomId && event) {
                    const roomKey = `room:${roomId}`;
                    redisClient.hSet(roomKey, event, JSON.stringify({
                        ...payload,
                        timestamp: new Date().toISOString()
                    }));

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

function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis 클라이언트가 초기화되지 않았습니다.');
    }
    return redisClient;
}

function getRedisSubscriber() {
    if (!redisSubscriber) {
        throw new Error('Redis 구독자가 초기화되지 않았습니다.');
    }
    return redisSubscriber;
}

module.exports = {
    initializeRedis,
    getRedisClient,
    getRedisSubscriber
};
