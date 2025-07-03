const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Неверный формат токена' });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.iss || decoded.iss !== process.env.JWT_ISSUER) {
      return res.status(403).json({ error: 'Недействительный токен' });
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
        lastActive: true
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Учетная запись заблокирована' });
    }

    prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    }).catch(console.error);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Срок действия токена истек' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    console.error('Ошибка аутентификации:', err);
    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
}

module.exports = auth;
