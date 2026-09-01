require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const workerRoutes = require('./routes/workerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

// Expose socket.io server context to route handlers
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidfix';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const jwt = require('jsonwebtoken');
const WorkerProfile = require('./models/WorkerProfile');
const Message = require('./models/Message');

// Socket.io Setup
// Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded; // { id, role }
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

  // Join a room specific to this user for private messages/notifications
  socket.join(`user_${socket.user.id}`);

  // Handle worker location updates
  socket.on('worker:updateLocation', async (data) => {
    if (socket.user.role !== 'worker') return;
    
    const { latitude, longitude } = data;
    if (latitude && longitude) {
      try {
        // Update in database (optional but good for persistence)
        await WorkerProfile.findOneAndUpdate(
          { userId: socket.user.id },
          { 
            location: { type: 'Point', coordinates: [longitude, latitude] },
            lastLocationUpdate: Date.now()
          }
        );

        // Broadcast to all customers looking at the map
        socket.broadcast.emit('worker:locationUpdated', {
          workerId: socket.user.id,
          latitude,
          longitude
        });
      } catch (error) {
        console.error('Socket update location error:', error);
      }
    }
  });

  // JOIN CHAT ROOM
  socket.on('chat:joinRoom', (data) => {
    const { jobId } = data;
    if (jobId) {
      socket.join(`chat_${jobId}`);
      console.log(`Socket ${socket.id} joined chat room: chat_${jobId}`);
    }
  });

  // SEND MESSAGE
  socket.on('chat:sendMessage', async (data) => {
    const { jobId, receiverId, message } = data;
    if (jobId && receiverId && message) {
      try {
        const msg = await Message.create({
          jobId,
          senderId: socket.user.id,
          receiverId,
          message,
        });

        // Broadcast the message to the chat room (to both sender and receiver if joined)
        io.to(`chat_${jobId}`).emit('chat:messageReceived', {
          _id: msg._id,
          jobId: msg.jobId,
          senderId: {
            _id: socket.user.id,
          },
          receiverId: msg.receiverId,
          message: msg.message,
          createdAt: msg.createdAt,
        });
      } catch (error) {
        console.error('Socket send message error:', error);
      }
    }
  });

  // TYPING INDICATORS
  socket.on('chat:typing', (data) => {
    const { jobId } = data;
    if (jobId) {
      socket.to(`chat_${jobId}`).emit('chat:typingStatus', {
        jobId,
        userId: socket.user.id,
        isTyping: true,
      });
    }
  });

  socket.on('chat:stopTyping', (data) => {
    const { jobId } = data;
    if (jobId) {
      socket.to(`chat_${jobId}`).emit('chat:typingStatus', {
        jobId,
        userId: socket.user.id,
        isTyping: false,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`RapidFix Server running on port ${PORT}`);
});
