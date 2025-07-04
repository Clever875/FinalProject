import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Неверный формат токена' });
  }
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.iss || decoded.iss !== process.env.JWT_ISSUER) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
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

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() }
      });
    } catch (updateError) {
      console.error('Ошибка обновления времени активности:', updateError);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Срок действия токена истек',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Недействительный токен',
        code: 'INVALID_TOKEN',
        details: err.message
      });
    }

    console.error('Ошибка аутентификации:', err);
    return res.status(500).json({
      error: 'Ошибка аутентификации',
      code: 'AUTH_ERROR'
    });
  }
}
