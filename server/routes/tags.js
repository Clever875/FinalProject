import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const fullTemplateInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  questions: {
    include: {
      options: true
    },
    orderBy: {
      order: 'asc'
    }
  },
  tags: {
    select: {
      tag: true
    }
  },
  allowedUsers: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  _count: {
    select: {
      forms: true,
      likes: true
    }
  }
};

router.use(auth);

async function checkAccess(templateId, user) {
  const id = Number(templateId);
  if (isNaN(id)) return { error: 'Неверный ID шаблона', status: 400 };

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      allowedUsers: {
        select: { id: true }
      }
    }
  });

  if (!template) return { error: 'Шаблон не найден', status: 404 };

  const isOwner = template.ownerId === user.id;
  const isAdmin = user.role === 'ADMIN';
  const isAllowed = template.isPublic ||
                   template.allowedUsers.some(u => u.id === user.id) ||
                   isOwner;

  if (!isOwner && !isAdmin && !isAllowed) {
    return { error: 'Нет доступа к этому шаблону', status: 403 };
  }

  return { template };
}

router.post('/', async (req, res) => {
  const {
    title,
    description,
    topic,
    imageUrl,
    isPublic = false,
    tags = [],
    questions = [],
    allowedUsers = []
  } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ error: 'Название должно содержать не менее 3 символов' });
  }

  if (questions.length === 0) {
    return res.status(400).json({ error: 'Добавьте хотя бы один вопрос' });
  }

  try {
    const tagOperations = tags.map(tagName => {
      return prisma.tag.upsert({
        where: { name: tagName },
        update: { count: { increment: 1 } },
        create: { name: tagName, count: 1 }
      });
    });

    const createdTags = await Promise.all(tagOperations);

    const newTemplate = await prisma.template.create({
      data: {
        title: title.trim(),
        description: description || '',
        topic: topic || 'Other',
        imageUrl,
        isPublic,
        ownerId: req.user.id,
        allowedUsers: {
          connect: allowedUsers.map(id => ({ id }))
        },
        tags: {
          create: createdTags.map(tag => ({
            tag: { connect: { id: tag.id } }
          }))
        },
        questions: {
          create: questions.map((q, i) => ({
            title: q.title,
            description: q.description || '',
            type: q.type,
            order: i,
            isRequired: q.isRequired !== false,
            displayInTable: q.displayInTable || false,
            options: {
              create: (q.options || []).map(option => ({
                value: option.value || option.text || ''
              }))
            }
          }))
        }
      },
      include: fullTemplateInclude
    });

    res.status(201).json(newTemplate);
  } catch (err) {
    console.error('❌ Ошибка создания шаблона:', err);
    res.status(500).json({ error: 'Ошибка при создании шаблона' });
  }
});

router.get('/public', async (req, res) => {
  const { search = '', page = 1, limit = 10, sort = 'newest' } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  try {
    const where = {
      isPublic: true,
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } }
      ]
    };

    const orderBy = sort === 'popular'
      ? [{ forms: { _count: 'desc' } }]
      : [{ createdAt: 'desc' }];

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limitInt,
        orderBy,
        include: fullTemplateInclude
      }),
      prisma.template.count({ where })
    ]);

    res.json({
      data: templates,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
      },
    });
  } catch (err) {
    console.error('🔥 Ошибка получения публичных шаблонов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/user', async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  try {
    const where = {
      ownerId: req.user.id,
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    };

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limitInt,
        orderBy: { createdAt: 'desc' },
        include: fullTemplateInclude
      }),
      prisma.template.count({ where })
    ]);

    res.json({
      data: templates,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
      },
    });
  } catch (err) {
    console.error('Ошибка загрузки шаблонов пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Неверный ID шаблона' });

  try {
    const { template, error, status } = await checkAccess(id, req.user);
    if (error) return res.status(status).json({ error });

    const fullTemplate = await prisma.template.findUnique({
      where: { id },
      include: fullTemplateInclude
    });

    if (!fullTemplate) return res.status(404).json({ error: 'Шаблон не найден' });

    res.json(fullTemplate);
  } catch (err) {
    console.error('Ошибка загрузки шаблона:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Неверный ID шаблона' });

  const {
    title,
    description,
    topic,
    imageUrl,
    isPublic,
    tags = [],
    questions = [],
    allowedUsers = []
  } = req.body;

  try {
    const { template, error, status } = await checkAccess(id, req.user);
    if (error) return res.status(status).json({ error });

    const tagOperations = tags.map(tagName => {
      return prisma.tag.upsert({
        where: { name: tagName },
        update: { count: { increment: 1 } },
        create: { name: tagName, count: 1 }
      });
    });

    const createdTags = await Promise.all(tagOperations);
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { templateId: id } }),
      prisma.templateTag.deleteMany({ where: { templateId: id } })
    ]);

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        title: title || template.title,
        description: description || template.description,
        topic: topic || template.topic,
        imageUrl: imageUrl || template.imageUrl,
        isPublic: isPublic !== undefined ? isPublic : template.isPublic,
        allowedUsers: {
          set: allowedUsers.map(id => ({ id }))
        },
        tags: {
          create: createdTags.map(tag => ({
            tag: { connect: { id: tag.id } }
          }))
        },
        questions: {
          create: questions.map((q, i) => ({
            title: q.title,
            description: q.description || '',
            type: q.type,
            order: i,
            isRequired: q.isRequired !== false,
            displayInTable: q.displayInTable || false,
            options: {
              create: (q.options || []).map(option => ({
                value: option.value || option.text || ''
              }))
            }
          }))
        }
      },
      include: fullTemplateInclude
    });

    res.json(updatedTemplate);
  } catch (err) {
    console.error('Ошибка обновления шаблона:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/', async (req, res) => {
  const { ids } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Не указаны ID шаблонов для удаления' });
  }

  try {
    const templates = await prisma.template.findMany({
      where: { id: { in: ids.map(id => Number(id)) } },
      select: { id: true, ownerId: true }
    });

    const deletableIds = templates
      .filter(tpl => isAdmin || tpl.ownerId === userId)
      .map(tpl => tpl.id);

    if (deletableIds.length === 0) {
      return res.status(403).json({ error: 'Нет прав для удаления указанных шаблонов' });
    }

    await prisma.$transaction([
      prisma.form.deleteMany({ where: { templateId: { in: deletableIds } } }),
      prisma.templateTag.deleteMany({ where: { templateId: { in: deletableIds } } }),
      prisma.question.deleteMany({ where: { templateId: { in: deletableIds } } }),
      prisma.template.deleteMany({ where: { id: { in: deletableIds } } })
    ]);

    const tagsToUpdate = await prisma.tag.findMany({
      where: { templates: { some: { templateId: { in: deletableIds } } } }
    });

    for (const tag of tagsToUpdate) {
      const count = await prisma.templateTag.count({
        where: { tagId: tag.id }
      });

      await prisma.tag.update({
        where: { id: tag.id },
        data: { count }
      });
    }

    res.json({
      success: true,
      deleted: deletableIds,
      message: `Удалено шаблонов: ${deletableIds.length}`
    });
  } catch (err) {
    console.error('Ошибка удаления шаблонов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/:id/questions', async (req, res) => {
  const templateId = Number(req.params.id);
  if (isNaN(templateId)) return res.status(400).json({ error: 'Неверный ID шаблона' });

  const { question } = req.body;
  if (!question || !question.title) {
    return res.status(400).json({ error: 'Неверные данные вопроса' });
  }

  try {
    const { template, error, status } = await checkAccess(templateId, req.user);
    if (error) return res.status(status).json({ error });

    const lastQuestion = await prisma.question.findFirst({
      where: { templateId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    const newQuestion = await prisma.question.create({
      data: {
        title: question.title,
        description: question.description || '',
        type: question.type || 'TEXT',
        order: newOrder,
        isRequired: question.isRequired !== false,
        displayInTable: question.displayInTable || false,
        templateId,
        options: {
          create: (question.options || []).map(option => ({
            value: option.value || option.text || ''
          }))
        }
      },
      include: { options: true }
    });

    res.status(201).json(newQuestion);
  } catch (err) {
    console.error('Ошибка при добавлении вопроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
