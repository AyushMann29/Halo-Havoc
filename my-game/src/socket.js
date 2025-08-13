
import { io } from "socket.io-client";
const SERVER_URL = 'https://halo-havoc.onrender.com';
// const socket = socketIO(SERVER_URL);
export const socket = io(SERVER_URL);
