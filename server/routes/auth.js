const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Имя должно содержать не менее 2 символов' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }

    const hash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash: hash,
        role: 'USER'
      },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        role: newUser.role,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
    });
  } catch (e) {
    console.error('Ошибка регистрации:', e);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
    });
  } catch (e) {
    console.error('Ошибка входа:', e);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Вы успешно вышли из системы' });
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, password, newPassword } = req.body;
    const updates = {};

    if (name && name.trim().length >= 2) {
      updates.name = name.trim();
    } else if (name) {
      return res.status(400).json({ error: 'Имя должно содержать не менее 2 символов' });
    }

    if (avatar) {
      updates.avatar = avatar;
    }

    if (password && newPassword) {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Новый пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }

      const isValid = await bcrypt.compare(password, req.user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }

      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    } else if (password || newPassword) {
      return res.status(400).json({ error: 'Для смены пароля укажите текущий и новый пароль' });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      }
    });

    let newToken;
    if (updates.passwordHash) {
      newToken = jwt.sign(
        {
          id: updatedUser.id,
          role: updatedUser.role,
          iss: process.env.JWT_ISSUER,
          aud: process.env.JWT_AUDIENCE,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
    }

    res.json({
      user: updatedUser,
      token: newToken || req.token,
    });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { authorId: req.user.id } }),
      prisma.like.deleteMany({ where: { userId: req.user.id } }),
      prisma.form.deleteMany({ where: { userId: req.user.id } }),
      prisma.template.deleteMany({ where: { ownerId: req.user.id } }),
      prisma.user.delete({ where: { id: req.user.id } }),
    ]);

    res.json({ message: 'Аккаунт и все связанные данные удалены' });
  } catch (err) {
    console.error('Ошибка удаления аккаунта:', err);
    res.status(500).json({ error: 'Ошибка удаления аккаунта' });
  }
});

module.exports = router;
