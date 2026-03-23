import { io, Socket } from 'socket.io-client';
import { store } from '@/store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): void {
  const token = store.getState().auth.accessToken;
  if (!token) return;
  const s = getSocket();
  s.auth = { token };
  s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
