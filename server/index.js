import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

import adminRoutes from './routes/admin.js';
import templatesRouter from './routes/templates.js';
import authRoutes from './routes/auth.js';
import formRoutes from './routes/forms.js';
import likesRouter from './routes/likes.js';
import commentsRoutes from './routes/comments.js';
import analyticsRoutes from './routes/analytics.js';
import tagsRoutes from './routes/tags.js';

dotenv.config();
const prisma = new PrismaClient();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Основные middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// FIX: Добавлено для корректной работы с reverse proxy
app.set('trust proxy', 1); // <-- Важное исправление

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
app.use(express.json({
  strict: false,
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString('utf8'));
    } catch (e) {
      res.status(400).json({ error: "Invalid JSON" });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use('/api/tags', tagsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/templates', templatesRouter);
app.use('/api/forms', formRoutes);
app.use('/api/likes', likesRouter);
app.use('/api/comments', commentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Healthcheck endpoints
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static client build
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Server setup
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('subscribeToTemplate', (templateId) => {
    socket.join(`template_${templateId}`);
    console.log(`Client subscribed to template ${templateId}`);
  });

  socket.on('newComment', async (data) => {
    try {
      const newComment = await prisma.comment.create({
        data: {
          text: data.text,
          template: { connect: { id: data.template_id } },
          author: { connect: { id: data.user_id } }
        },
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });
      io.to(`template_${data.template_id}`).emit('updateComments', newComment);
    } catch (err) {
      console.error('Error saving comment:', err);
    }
  });

  socket.on('toggleLike', async (data) => {
    try {
      const existingLike = await prisma.like.findFirst({
        where: {
          templateId: data.template_id,
          userId: data.user_id
        }
      });

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
        io.to(`template_${data.template_id}`).emit('likeUpdated', {
          templateId: data.template_id,
          action: 'removed'
        });
      } else {
        await prisma.like.create({
          data: {
            template: { connect: { id: data.template_id } },
            user: { connect: { id: data.user_id } }
          }
        });
        io.to(`template_${data.template_id}`).emit('likeUpdated', {
          templateId: data.template_id,
          action: 'added'
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Startup and shutdown
async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to DB:', err);
    process.exit(1);
  }
}

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
