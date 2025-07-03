const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

router.use(auth);
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
      include: {
        template: {
          select: {
            title: true,
            description: true,
            ownerId: true,
            isPublic: true,
            allowedUsers: true
          }
        },
        answers: {
          include: {
            question: {
              select: {
                title: true,
                description: true,
                type: true,
                isRequired: true
              }
            }
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: "Форма не найдена" });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = form.authorId === userId;
    const isTemplateOwner = form.template.ownerId === userId;
    const isAllowed = form.template.isPublic ||
                     form.template.allowedUsers.includes(userId);

    if (!isOwner && !isAdmin && !isTemplateOwner && !isAllowed) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    res.json(form);
  } catch (error) {
    console.error("Ошибка при получении формы:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, status, templateId } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  try {
    const where = { authorId: userId };

    if (status === 'draft' || status === 'completed') {
      where.completed = status === 'completed';
    }

    if (templateId && !isNaN(templateId)) {
      where.templateId = parseInt(templateId);
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: limitInt,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      }),
      prisma.form.count({ where })
    ]);

    res.json({
      data: forms,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
      },
    });
  } catch (error) {
    console.error('Ошибка при получении форм:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post("/create/:templateId", async (req, res) => {
  const userId = req.user.id;
  const templateId = Number(req.params.templateId);

  if (isNaN(templateId)) {
    return res.status(400).json({ error: "Неверный ID шаблона" });
  }

  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        isPublic: true,
        allowedUsers: true,
        ownerId: true
      }
    });

    if (!template) {
      return res.status(404).json({ error: "Шаблон не найден" });
    }

    const isAllowed = template.isPublic ||
                      template.allowedUsers.includes(userId) ||
                      template.ownerId === userId;

    if (!isAllowed) {
      return res.status(403).json({ error: "Нет доступа к этому шаблону" });
    }

    const questions = await prisma.question.findMany({
      where: { templateId },
      select: { id: true }
    });

    const form = await prisma.form.create({
      data: {
        authorId: userId,
        templateId,
        completed: false,
        answers: {
          create: questions.map(q => ({
            questionId: q.id,
            value: ''
          }))
        }
      },
      include: {
        template: true,
        answers: true
      }
    });

    res.status(201).json(form);
  } catch (error) {
    console.error("Ошибка при создании формы:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { answers, completed } = req.body;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
      include: {
        template: {
          select: {
            questions: {
              select: { id: true, isRequired: true }
            }
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Форма не найдена' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = form.authorId === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Нет прав на изменение формы' });
    }

    if (completed) {
      const requiredQuestions = form.template.questions
        .filter(q => q.isRequired)
        .map(q => q.id);

      const unanswered = requiredQuestions.filter(qId =>
        !answers.some(a => a.questionId === qId && a.value !== '')
      );

      if (unanswered.length > 0) {
        return res.status(400).json({
          error: 'Не все обязательные вопросы заполнены',
          unanswered
        });
      }
    }

    const updateOperations = answers.map(answer => {
      return prisma.answer.upsert({
        where: {
          formId_questionId: {
            formId: form.id,
            questionId: answer.questionId
          }
        },
        update: { value: answer.value },
        create: {
          formId: form.id,
          questionId: answer.questionId,
          value: answer.value
        }
      });
    });

    const updateForm = prisma.form.update({
      where: { id: form.id },
      data: { completed: completed || form.completed }
    });

    await prisma.$transaction([...updateOperations, updateForm]);

    const updatedForm = await prisma.form.findUnique({
      where: { id: form.id },
      include: { answers: true }
    });

    res.json(updatedForm);
  } catch (error) {
    console.error('Ошибка при обновлении формы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
    });

    if (!form) {
      return res.status(404).json({ error: 'Форма не найдена' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = form.authorId === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await prisma.answer.deleteMany({
      where: { formId: form.id }
    });

    await prisma.form.delete({
      where: { id: form.id }
    });

    res.json({ message: 'Форма удалена' });
  } catch (error) {
    console.error('Ошибка при удалении формы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
