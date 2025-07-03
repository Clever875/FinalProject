const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const requireAuth = require("../middleware/auth");

router.use(requireAuth);

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
      include: {
        template: { select: { title: true, description: true } },
        answers: {
          include: {
            question: { select: { title: true, description: true, type: true } }
          }
        }
      }
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const isAdmin = req.user.role === "ADMIN";
    const isOwner = form.authorId === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const forms = await prisma.form.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            title: true,
            description: true
          }
        }
      }
    });

    res.json(forms);
  } catch (error) {
    console.error('Ошибка при получении форм:', error);
    res.status(500).json({ error: 'Не удалось получить формы' });
  }
});

router.post("/create/:id", async (req, res) => {
  const userId = req.user.id;
  const templateId = Number(req.params.templateId);
  if (isNaN(templateId)) return res.status(400).json({ error: "Неверный ID шаблона" });

  try {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ error: "Шаблон не найден" });

    const form = await prisma.form.create({
      data: {
        authorId: userId,
        templateId,
        answers: { create: [] }
      },
      include: { answers: true }
    });

    res.status(201).json(form);
  } catch (error) {
    console.error("Ошибка при создании формы:", error);
    res.status(500).json({ error: "Не удалось создать форму" });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
      include: { answers: true }
    });

    if (!form) return res.status(404).json({ error: 'Форма не найдена' });

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = form.authorId === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Нет доступа к изменению формы' });
    }
    await prisma.answer.deleteMany({
      where: { formId: form.id }
    });

    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: {
        answers: {
          create: answers.map(a => ({
            questionId: a.questionId,
            value: a.value
          }))
        }
      },
      include: { answers: true }
    });

    res.json(updatedForm);
  } catch (error) {
    console.error('Ошибка при обновлении формы:', error);
    res.status(500).json({ error: 'Не удалось обновить форму' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const form = await prisma.form.findUnique({
      where: { id: Number(id) },
    });
    if (!form) return res.status(404).json({ error: 'Форма не найдена' });
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
    res.status(500).json({ error: 'Не удалось удалить форму' });
  }
});

module.exports = router;
