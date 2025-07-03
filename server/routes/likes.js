const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

router.use(auth);
router.post('/:templateId', async (req, res) => {
  const templateId = Number(req.params.templateId);
  const userId = req.user.id;

  if (isNaN(templateId)) {
    return res.status(400).json({ error: 'Неверный ID шаблона' });
  }

  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        templateId,
        userId
      }
    });

    let result;
    if (existingLike) {
      result = await prisma.like.delete({
        where: { id: existingLike.id }
      });
    } else {
      result = await prisma.like.create({
        data: {
          templateId,
          userId
        },
        include: {
          template: { select: { title: true } },
          user: { select: { username: true } }
        }
      });
    }
    const count = await prisma.like.count({
      where: { templateId }
    });

    res.json({
      liked: !existingLike,
      count
    });
  } catch (err) {
    console.error('Ошибка при обработке лайка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.get('/:templateId/count', async (req, res) => {
  const templateId = Number(req.params.templateId);

  if (isNaN(templateId)) {
    return res.status(400).json({ error: 'Неверный ID шаблона' });
  }

  try {
    const count = await prisma.like.count({
      where: { templateId }
    });
    res.json({ count });
  } catch (err) {
    console.error('Ошибка при получении лайков:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.get('/:templateId/status', async (req, res) => {
  const templateId = Number(req.params.templateId);
  const userId = req.user.id;

  if (isNaN(templateId)) {
    return res.status(400).json({ error: 'Неверный ID шаблона' });
  }

  try {
    const like = await prisma.like.findFirst({
      where: {
        templateId,
        userId
      }
    });
    res.json({ liked: !!like });
  } catch (err) {
    console.error('Ошибка при проверке лайка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
