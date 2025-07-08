import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitInt = parseInt(limit);

    if (isNaN(limitInt) || limitInt <= 0) {
      return res.status(400).json({ error: 'Неверный параметр limit' });
    }

    const popularTags = await prisma.tag.findMany({
      take: limitInt,
      orderBy: {
        templateTags: {
          _count: 'desc'
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            templateTags: true
          }
        }
      }
    });

    // Форматируем результат для клиента
    const formattedTags = popularTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.templateTags
    }));

    res.json(formattedTags);
  } catch (err) {
    console.error('🔥 Ошибка при получении популярных тегов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
