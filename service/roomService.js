const { generateHash } = require('../common/utils/hashGenerator');
const { AppError, logger } = require('../common/error/errorHandler');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

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

    generateRoomId(roomName) {
        if (!roomName) {
            throw new AppError('roomName은 필수입니다.', 400);
        }

        const timestamp = new Date();
        const roomId = generateHash(roomName, timestamp);
        
        logger.info('방 ID 생성', { 
            roomId, 
            roomName,
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

    async createRoom(mode, roomId, roomName, madeBy, userName) {
        if (!mode) {
            throw new AppError('mode는 필수입니다.', 400);
        }

        const timestamp = new Date();
        
        logger.info('방 생성 시도', { 
            roomId, 
            mode,
            madeBy,
            action: 'create',
            timestamp: timestamp.toISOString()
        });

        const client = await this.getMongoClient();
        const database = client.db('whiteboard_db');
        const collection = database.collection('whiteboard_rooms');

        // 방이 이미 존재하는지 확인
        const existingRoom = await collection.findOne({ roomId });
        if (existingRoom) {
            logger.warn('방 생성 실패 - 이미 존재하는 방', { 
                roomId, 
                mode,
                madeBy,
                action: 'create',
                timestamp: timestamp.toISOString()
            });
            throw new AppError('이미 존재하는 방입니다.', 409);
        }

        await collection.insertOne({
            roomId,
            roomName,
            mode,
            madeBy,
            createdAt: timestamp,
            participants: [{
                userId: madeBy.userId,
                userName: madeBy.username,
                joinedAt: timestamp
            }]
        }); 

        logger.info('방 생성 완료', { 
            roomId, 
            mode,
            madeBy,
            action: 'create',
            timestamp: timestamp.toISOString()
        });

        return {
            roomId,
            mode,
            madeBy,
            userName,
            timestamp,
            participants: [{
                userId: madeBy.userId,
                userName: madeBy.username,
                joinedAt: timestamp
            }]
        };
    }

    async joinRoom(roomId, mode, req) {
        if (!roomId || !mode) {
            throw new AppError('roomId, mode는 필수입니다.', 400);
        }

        const userId = req.user?.userId;
        const userName = req.user?.username;

        const client = await this.getMongoClient();
        const database = client.db('whiteboard_db');
        const collection = database.collection('whiteboard_rooms');
        
        const room = await collection.findOne({ roomId });
        if (!room) {
            throw new AppError('존재하지 않는 방입니다.', 404);
        }

        // 방 참가자 정보 업데이트 (중복 방지)
        await collection.updateOne(
            { roomId },
            { 
                $addToSet: { 
                    participants: {
                        userId: String(userId),
                        userName,
                        joinedAt: new Date()
                    }
                }
            }
        );

        logger.info('방 참가 완료', { 
            roomId, 
            mode,
            userId,
            userName,
            action: 'join',
            timestamp: new Date().toISOString()
        });

        return {
            roomId,
            mode,
            userId,
            userName,
            timestamp: new Date()
        };
    }

    async leaveRoom(roomId, userId) {
        if (!roomId || !userId) {
            throw new AppError('roomId와 userId는 필수입니다.', 400);
        }

        const client = await this.getMongoClient();
        const database = client.db('whiteboard_db');
        const collection = database.collection('whiteboard_rooms');

        // 방이 존재하는지 확인
        const room = await collection.findOne({ roomId });
        if (!room) {
            throw new AppError('존재하지 않는 방입니다.', 404);
        }

        // 참가자 목록에서 사용자 제거
        const result = await collection.updateOne(
            { roomId },
            {
                $pull: {
                    participants: { userId: String(userId) }
                }
            }
        );

        logger.info('방 퇴장 결과', {
            roomId,
            userId,
            modifiedCount: result.modifiedCount,
            action: 'leave_result',
            timestamp: new Date().toISOString()
        });

    
    }
}

module.exports = new RoomService(); 