const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

router.get('/public', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      include: {
        createdBy: true,
        templateTags: {
          include: { tag: true },
        },
      },
    });
    res.json(templates);
  } catch (err) {
    console.error('🔥 Ошибка в /templates/public:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.use(auth);

router.post('/', async (req, res) => {
  const {
    title,
    description,
    theme,
    imageUrl,
    isPublic = false,
    tags = [],
    questions = []
  } = req.body;

  try {
    const newTemplate = await prisma.template.create({
      data: {
        title,
        description,
        theme,
        imageUrl,
        isPublic,
        createdBy: { connect: { id: req.user.id } },
        templateTags: {
          create: tags.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        },
        questions: {
          create: questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            order: index,
            displayInTable: q.displayInTable || false,
            isRequired: q.isRequired !== false,
            options: {
              create: (q.options || []).map(opt => ({ value: opt }))
            }
          }))
        }
      },
      include: {
        questions: { include: { options: true } },
        createdBy: true,
        templateTags: { include: { tag: true } }
      }
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Ошибка при создании шаблона:', error);
    res.status(500).json({ error: 'Не удалось создать шаблон' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { tags: true, questions: true },
    });
    res.json(templates);
  } catch (error) {
    console.error('Ошибка при загрузке шаблонов:', error);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { include: { options: true } },
        templateTags: { include: { tag: true } }
      }
    });

    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });

    const isOwner = template.createdById === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const {
    title,
    description,
    theme,
    imageUrl,
    isPublic,
    tags = [],
    questions = []
  } = req.body;

  try {
    const existing = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) return res.status(404).json({ error: 'Шаблон не найден' });

    const isOwner = existing.createdById === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    await prisma.question.deleteMany({ where: { templateId: req.params.id } });
    await prisma.templateTag.deleteMany({ where: { templateId: req.params.id } });

    const updated = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        theme,
        imageUrl,
        isPublic,
        templateTags: {
          create: tags.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        },
        questions: {
          create: questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            order: index,
            displayInTable: q.displayInTable || false,
            isRequired: q.isRequired !== false,
            options: {
              create: (q.options || []).map(opt => ({ value: opt }))
            }
          }))
        }
      },
      include: {
        questions: { include: { options: true } },
        templateTags: { include: { tag: true } }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('Ошибка при обновлении шаблона:', err);
    res.status(500).json({ error: 'Не удалось обновить шаблон' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });

    const isOwner = template.createdById === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    await prisma.template.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Шаблон удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
