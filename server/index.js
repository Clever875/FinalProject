const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const adminRoutes = require('./routes/admin');
const templatesRouter = require('./routes/templates');
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const likesRouter = require('./routes/likes');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tags', require('./routes/tags'));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/templates', templatesRouter);
app.use('/api/forms', formRoutes);
app.use('/api/likes', likesRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('newComment', async (data) => {
    try {
      const newComment = await prisma.comment.create({
        data: {
          text: data.text,
          templateId: data.template_id,
          authorId: data.user_id
        }
      });
      io.emit('updateComments', newComment);
    } catch (err) {
      console.error('Error saving comment:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    server.listen(PORT, () => {
      console.log(`Server with WebSocket running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to DB:', err);
  }
}

start();
