export default (allowedRoles) => {
  if (!Array.isArray(allowedRoles)) {
    throw new Error('Параметр allowedRoles должен быть массивом');
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
      }
      if (req.user.isBlocked) {
        return res.status(403).json({ error: 'Учетная запись заблокирована' });
      }

      const hasRequiredRole = allowedRoles.includes(req.user.role);

      const isSelfAction = req.params.userId && req.params.userId === req.user.id;
      const isAdminAction = allowedRoles.includes('ADMIN') && req.user.role === 'ADMIN' && isSelfAction;

      if (!hasRequiredRole && !isAdminAction) {
        console.warn(`Попытка несанкционированного доступа:
          Пользователь: ${req.user.email} (${req.user.role})
          Требуемые роли: ${allowedRoles.join(', ')}
          Путь: ${req.originalUrl}
          Метод: ${req.method}`);

        return res.status(403).json({
          error: 'Недостаточно прав',
          requiredRoles: allowedRoles,
          yourRole: req.user.role
        });
      }

      if (req.method !== 'GET') {
        const lastActive = new Date(req.user.lastActive);
        const now = new Date();
        const diffHours = (now - lastActive) / (1000 * 60 * 60);

        if (diffHours > 24) {
          return res.status(403).json({
            error: 'Требуется повторная аутентификация',
            reason: 'Сессия устарела',
            lastActive: req.user.lastActive
          });
        }
      }

      next();
    } catch (error) {
      console.error('Ошибка проверки прав доступа:', error);
      res.status(500).json({
        error: 'Ошибка проверки прав доступа',
        details: error.message
      });
    }
  };
};
