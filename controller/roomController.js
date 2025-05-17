const express = require('express');
const router = express.Router();
const { AppError } = require('../common/error/errorHandler');
const roomService = require('../service/roomService');

const roomController = {
    generateRoomId: async (req, res, next) => {
        try {
            const { roomName } = req.body;
            const result = roomService.generateRoomId(roomName);

            res.json({
                success: true,
                roomId: result.roomId,
                roomName: result.roomName,
                timestamp: result.timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    createRoom: async (req, res, next) => {
        try {
            const { mode, roomId, roomName } = req.body;
            
            const result = await roomService.createRoom(mode, roomId, roomName);
            res.json({
                success: true,
                message: "방 생성 성공",
                mode: result.mode,
                roomId: result.roomId,
                timestamp: result.timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    joinRoom: async (req, res, next) => {
        try {            
            const { roomId, mode} = req.query;
            const userId = req.user.userId;
            if (!roomId || !mode || !userId) {
                throw new AppError('roomId, mode, userId는 필수입니다.', 400);
            }
            

            const result = await roomService.joinRoom(roomId, mode, userId);
            res.json({
                success: true,
                message: "방 참가 성공",
                mode: result.mode,
                roomId: result.roomId,
                timestamp: result.timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = roomController;
