import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'F&B Ordering API is running' });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
export { app as expressApp, io, prisma };
