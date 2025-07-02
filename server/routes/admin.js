const express = require('express');
const { User } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

router.get('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    res.json(users);
  } catch (err) {
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
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.role = newRole;
    await user.save();

    res.json({ message: 'Роль обновлена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
