import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/users', auth, checkRole(['ADMIN']), async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  try {
    const whereClause = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          lastActive: true
        },
        skip,
        take: limitInt,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
      },
    });
  } catch (err) {
    console.error('Ошибка при получении пользователей:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/users/:id/role', auth, checkRole(['ADMIN']), async (req, res) => {
  const { role: newRole } = req.body;
  const { id } = req.params;

  const allowedRoles = ['ADMIN', 'MODERATOR', 'USER'];
  if (!allowedRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }

  try {
    const userId = parseInt(id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.id === req.user.id && newRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Вы не можете изменить свою роль' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    res.json({ message: 'Роль пользователя обновлена' });
  } catch (err) {
    console.error('Ошибка при обновлении роли:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/users/:id/block', auth, checkRole(['ADMIN']), async (req, res) => {
  const { isBlocked } = req.body;
  const { id } = req.params;

  try {
    const userId = parseInt(id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.id === req.user.id) {
      return res.status(403).json({ error: 'Вы не можете заблокировать себя' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !!isBlocked },
    });

    res.json({
      message: `Пользователь успешно ${isBlocked ? 'заблокирован' : 'разблокирован'}`
    });
  } catch (err) {
    console.error('Ошибка при блокировке пользователя:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.delete('/users/:id', auth, checkRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.id === req.user.id) {
      return res.status(403).json({ error: 'Вы не можете удалить себя' });
    }

    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.like.deleteMany({ where: { userId: userId } }),
      prisma.form.deleteMany({ where: { userId: userId } }),
      prisma.template.deleteMany({ where: { ownerId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    res.json({ message: 'Пользователь и все связанные данные удалены' });
  } catch (err) {
    console.error('Ошибка при удалении пользователя:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
