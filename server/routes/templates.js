const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

const fullTemplateInclude = {
  createdBy: true,
  questions: { include: { options: true } },
  templateTags: { include: { tag: true } },
};

router.use(auth);

async function checkAccess(templateId, user) {
  const id = Number(templateId);
  if (isNaN(id)) return { error: 'Неверный ID шаблона' };

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return { error: 'Шаблон не найден' };

  const isOwner = template.ownerId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) return { error: 'Нет доступа' };

  return { template };
}
router.post('/add-question', auth, async (req, res) => {
    const { templateId, questionData } = req.body;
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).send('Template not found');

    const newQuestion = new Question(questionData);
    template.questions.push(newQuestion);
    await template.save();

    res.status(200).send(newQuestion);
});

router.get('/public', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      include: fullTemplateInclude,
    });
    res.json(templates);
  } catch (err) {
    console.error('🔥 Ошибка /templates/public:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.use(auth);
router.post('/', async (req, res) => {
  const { title, description, theme, imageUrl, isPublic = false, tags = [], questions = [] } = req.body;

  try {
    const newTemplate = await prisma.template.create({
      data: {
        title,
        description,
        theme,
        imageUrl,
        isPublic,
        ownerId: req.user.id,
        templateTags: {
          create: tags.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        },
        questions: {
          create: questions.map((q, i) => ({
            title: q.text || q.title,
            type: q.type,
            order: i,
            displayInTable: q.displayInTable || false,
            isRequired: q.isRequired !== false,
            options: {
              create: (q.options || []).map(value => ({ value }))
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

router.get('/user', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: fullTemplateInclude
    });
    res.json(templates);
  } catch (err) {
    console.error('Ошибка загрузки шаблонов:', err);
    res.status(500).json({ error: 'Ошибка загрузки шаблонов' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Неверный ID шаблона' });

  const { template, error } = await checkAccess(id, req.user);
  if (error) return res.status(403).json({ error });

  try {
    const fullTemplate = await prisma.template.findUnique({
      where: { id },
      include: fullTemplateInclude
    });

    if (!fullTemplate) return res.status(404).json({ error: 'Шаблон не найден' });

    res.json(fullTemplate);
  } catch (err) {
    console.error('Ошибка загрузки шаблона:', err);
    res.status(500).json({ error: 'Ошибка загрузки шаблона' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Неверный ID шаблона' });

  const { title, description, theme, imageUrl, isPublic, tags = [], questions = [] } = req.body;

  const { template, error } = await checkAccess(id, req.user);
  if (error) return res.status(403).json({ error });

  try {
    await prisma.question.deleteMany({ where: { templateId: template.id } });
    await prisma.templateTag.deleteMany({ where: { templateId: template.id } });

    const updated = await prisma.template.update({
      where: { id: template.id },
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
          create: questions.map((q, i) => ({
            title: q.text || q.title,
            type: q.type,
            order: i,
            displayInTable: q.displayInTable || false,
            isRequired: q.isRequired !== false,
            options: {
              create: (q.options || []).map(value => ({ value }))
            }
          }))
        }
      },
      include: fullTemplateInclude
    });

    res.json(updated);
  } catch (err) {
    console.error('Ошибка обновления шаблона:', err);
    res.status(500).json({ error: 'Ошибка при обновлении шаблона' });
  }
});

router.post('/templates/delete', authenticate, async (req, res) => {
  const { ids } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const templates = await Template.findAll({ where: { id: ids } });

  const deletable = templates.filter(
    (tpl) => tpl.userId === userId || isAdmin
  );

  const deletableIds = deletable.map((tpl) => tpl.id);

  await Template.destroy({ where: { id: deletableIds } });

  res.json({ success: true, deleted: deletableIds });
});


module.exports = router;
