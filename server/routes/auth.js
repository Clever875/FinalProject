const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, passwordHash: hash },
    });

    res.status(201).json({ message: 'Пользователь успешно создан' });
  } catch (e) {
    console.error('REGISTER ERROR:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (password) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }
      const hash = await bcrypt.hash(password, 10);
      updates.passwordHash = hash;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('PROFILE UPDATE ERROR:', err);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    // В идеале здесь добавить каскадное удаление связанных данных (форм, ответов),
    // если в Prisma-схеме не настроено автоматически

    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: 'Аккаунт удалён' });
  } catch (err) {
    console.error('PROFILE DELETE ERROR:', err);
    res.status(500).json({ error: 'Ошибка удаления аккаунта' });
  }
});

module.exports = router;
