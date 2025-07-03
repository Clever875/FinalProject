const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { search = '', limit = 10 } = req.query;

  try {
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      take: parseInt(limit),
      orderBy: { count: 'desc' }
    });
    res.json(tags);
  } catch (err) {
    console.error('Ошибка загрузки тегов:', err);
    res.status(500).json({ error: 'Не удалось загрузить теги' });
  }
});

router.post('/update', async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Название тега слишком короткое' });
  }

  try {
    const tagName = name.trim().toLowerCase();
    const existingTag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    let tag;
    if (existingTag) {
      tag = await prisma.tag.update({
        where: { name: tagName },
        data: { count: existingTag.count + 1 }
      });
    } else {
      tag = await prisma.tag.create({
        data: { name: tagName, count: 1 }
      });
    }

    res.json(tag);
  } catch (err) {
    console.error('Ошибка обновления тега:', err);
    res.status(500).json({ error: 'Не удалось обновить тег' });
  }
});

module.exports = router;
