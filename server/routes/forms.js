const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const requireAuth = require("../middleware/auth");
module.exports = router;
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const form = await prisma.form.findUnique({
      where: { id },
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
router.post("/", requireAuth, async (req, res) => {
  const { templateId, answers } = req.body;
  const userId = req.user.id;

  try {
    const form = await prisma.form.create({
      data: {
        authorId: userId,
        templateId: templateId,
        answers: {
          create: answers.map(a => ({
            questionId: a.questionId,
            value: a.value
          }))
        }
      },
      include: { answers: true }
    });

    res.status(201).json(form);
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
});
