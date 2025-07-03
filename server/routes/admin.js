const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(users);
  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/users/:id/role', auth, checkRole(['admin']), async (req, res) => {
  const { role: newRole } = req.body;
  const { id } = req.params;

  const allowedRoles = ['admin', 'moderator', 'user', 'reader', 'guest'];
  if (!allowedRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }

  try {
    const userId = parseInt(id, 10);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    res.json({ message: 'Роль обновлена' });
  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
