import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticate from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/template/:templateId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { templateId: parseInt(req.params.templateId) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { text, templateId } = req.body;

    if (!text || !templateId) {
      return res.status(400).json({ error: 'Text and templateId are required' });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        templateId: parseInt(templateId),
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json(comment);

    if (req.io) {
      req.io.to(`template_${templateId}`).emit('newComment', comment);
    }
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Comment deleted successfully' });

    if (req.io) {
      req.io.to(`template_${comment.templateId}`).emit('commentDeleted', { id: comment.id });
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
