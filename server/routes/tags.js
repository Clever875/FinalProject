const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany();
    res.json(tags);
  } catch (err) {
    console.error('Ошибка загрузки тегов:', err);
    res.status(500).json({ error: 'Не удалось загрузить теги' });
  }
});

module.exports = router;
