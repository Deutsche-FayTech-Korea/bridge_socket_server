const { generateHash } = require('../common/utils/hashGenerator');
const { AppError, logger } = require('../common/error/errorHandler');
const { MongoClient, ServerApiVersion } = require('mongodb');

class RoomService {
    constructor() {
        this.uri = process.env.MONGODB_URI;
        this.MongoDbClient = null;
    }


    async getMongoClient() {
        try {
            if (!this.MongoDbClient) {
                this.MongoDbClient = new MongoClient(this.uri, {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                });
                await this.MongoDbClient.connect();
                console.log('MongoDB 연결 성공');
                logger.info('MongoDB 연결 성공');
            }
        } catch (error) {
            logger.error('MongoDB 연결 실패:', error.message);
            throw new AppError('MongoDB 연결 실패', 500);
        }
        return this.MongoDbClient;
    }

    generateRoomId(name) {
        if (!name) {
            throw new AppError('name은 필수입니다.', 400);
        }

        const timestamp = new Date();
        const roomId = generateHash(name, timestamp);
        
        logger.info('방 ID 생성', { 
            roomId, 
            name,
            timestamp: timestamp.toISOString()
        });

        return {
            roomId,
            timestamp
        };
    }

    generateRoomIdWithUser(userId, timestamp) {
        const timeStr = timestamp.getTime().toString(36);
        const userStr = userId.substring(0, 4);
        const randomStr = Math.random().toString(36).substring(2, 6);
        return `${userStr}-${timeStr}-${randomStr}`;
    }

    async createRoom(mode, roomId) {
        if (!mode) {
            throw new AppError('mode는 필수입니다.', 400);
        }

        const timestamp = new Date();
        
        logger.info('방 생성 시도', { 
            roomId, 
            mode,
            action: 'create',
            timestamp: timestamp.toISOString()
        });

        const client = await this.getMongoClient();
        const database = client.db('test');
        const collection = database.collection('room');
        await collection.insertOne({
            roomId,
            mode,
            createdAt: timestamp
        });

        logger.info('방 생성 완료', { 
            roomId, 
            mode,
            action: 'create',
            timestamp: timestamp.toISOString()
        });

        return {
            roomId,
            mode,
            timestamp
        };
    }

    async joinRoom(roomId, mode) {
        if (!roomId || !mode) {
            throw new AppError('roomId와 mode는 필수입니다.', 400);
        }

        const client = await this.getMongoClient();
        const database = client.db('test');
        const collection = database.collection('room');
        
        const room = await collection.findOne({ roomId });
        if (!room) {
            throw new AppError('존재하지 않는 방입니다.', 404);
        }

        logger.info('방 참가 시도', { 
            roomId, 
            mode,
            action: 'join',
            timestamp: new Date().toISOString()
        });

        logger.info('방 참가 완료', { 
            roomId, 
            mode,
            action: 'join',
            timestamp: new Date().toISOString()
        });

        const socket = await this.connectToRoomSocket();

        return {
            roomId,
            mode,
            timestamp: new Date()
        };
    }
}

module.exports = new RoomService(); 