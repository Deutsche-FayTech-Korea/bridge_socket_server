import { Server } from 'socket.io';

export default function socketConnect(server) {
    // Socket.IO 초기화
    const io = new Server(server, {
        cors: {
            origin: '*', // React 클라이언트 도메인
            methods: ['GET', 'POST'],
        },
        path: '/api/socket/',
    });

    // 연결 이벤트 처리
    io.on('connection', (socket) => {
        console.log(`연결: ${socket.id}`);

        // 방 참가 이벤트
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`사용자 ${socket.id}가 방 ${roomId}에 참가했습니다.`);
            
            // 방에 있는 다른 사용자들에게 새 참가자 알림
            socket.to(roomId).emit('userJoined', {
                userId: socket.id,
                timestamp: new Date()
            });
        });

        // 방 나가기 이벤트
        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            console.log(`사용자 ${socket.id}가 방 ${roomId}에서 나갔습니다.`);
            
            // 방에 있는 다른 사용자들에게 퇴장 알림
            socket.to(roomId).emit('userLeft', {
                userId: socket.id,
                timestamp: new Date()
            });
        });

        // 연결 해제 이벤트
        socket.on('disconnect', () => {
            console.log(`연결해제 : ${socket.id}`);
        });
    });

    return io;
}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io;
};

export const connectToRoom = (roomId) => {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io.in(roomId);
};

export const disconnectFromRoom = (roomId, socketId) => {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(roomId);
    }
};


