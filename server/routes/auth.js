import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

router.post('/refresh', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({ token: newToken });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Имя должно содержать не менее 2 символов' });
    }

    // Исправленная проверка email
    const emailInput = req.body.email ? req.body.email : '';
    if (!emailRegex.test(emailInput)) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: emailInput.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }

    const hash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailInput.toLowerCase(),
        passwordHash: hash,
        role: 'USER'
      },
    });

    const token = jwt.sign({
      id: newUser.id, // Исправлено: newUser вместо user
      role: newUser.role,
      iss: process.env.JWT_ISSUER || 'FormBuilder',
      aud: process.env.JWT_AUDIENCE || 'client',
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

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
    // Исправленная проверка email
    const email = req.body.email ? req.body.email.toLowerCase() : '';

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
    }

    const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
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

    if (name) {
      if (name.trim().length >= 2) {
        updates.name = name.trim();
      } else {
        return res.status(400).json({ error: 'Имя должно содержать не менее 2 символов' });
      }
    }

    if (avatar) {
      updates.avatar = avatar;
    }

    if (password && newPassword) {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Новый пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }

      // Получаем актуальные данные пользователя из БД
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
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
      // Исправленные запросы удаления
      prisma.comment.deleteMany({ where: { authorId: req.user.id } }),
      prisma.like.deleteMany({ where: { userId: req.user.id } }),
      prisma.form.deleteMany({ where: { authorId: req.user.id } }), // исправлено на authorId
      prisma.template.deleteMany({ where: { ownerId: req.user.id } }), // исправлено на ownerId
      prisma.user.delete({ where: { id: req.user.id } }),
    ]);

    res.json({ message: 'Аккаунт и все связанные данные удалены' });
  } catch (err) {
    console.error('Ошибка удаления аккаунта:', err);
    res.status(500).json({ error: 'Ошибка удаления аккаунта' });
  }
});

export default router;
