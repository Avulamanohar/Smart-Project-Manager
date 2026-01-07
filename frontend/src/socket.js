import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5005', {
    autoConnect: false,
});

export default socket;
