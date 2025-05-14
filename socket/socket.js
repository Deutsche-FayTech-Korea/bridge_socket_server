import { Server } from 'socket.io';


export  default function socketConnect(server) {
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

        // 클라이언트로부터 필기 데이터 수신 및 브로드캐스트
        socket.on('draw', (data) => {
            console.log(`Data ${socket.id}:`, data);
            socket.broadcast.emit('draw', data); // 다른 클라이언트로 데이터 브로드캐스트
        });

        // 연결 해제 이벤트
        socket.on('disconnect', () => {
            console.log(`연결해제 : ${socket.id}`);
        });
    });
}


