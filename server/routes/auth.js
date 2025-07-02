const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });

    res.status(201).json({ message: 'Пользователь успешно создан' });
  } catch (e) {
    console.error('REGISTER ERROR:', e);
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.user.id } });
    res.json({ message: 'Аккаунт удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления аккаунта' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.password = hash;
    }

    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );


  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
