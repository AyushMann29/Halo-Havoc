
import { io } from "socket.io-client";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
export const socket = socketIO(SERVER_URL);
// export const socket = io("https://halo-havoc.onrender.com");
