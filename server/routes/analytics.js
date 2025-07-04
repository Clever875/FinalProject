import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/template/:templateId', auth, async (req, res) => {
    try {
        const templateId = parseInt(req.params.templateId);

        const template = await prisma.template.findUnique({
            where: { id: templateId },
            select: { ownerId: true, isPublic: true }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const formCount = await prisma.form.count({
            where: { templateId }
        });

        const avgCompletionTime = await prisma.form.aggregate({
            where: { templateId },
            _avg: { completionTime: true }
        });

        const questions = await prisma.question.findMany({
            where: { templateId },
            include: {
                answers: {
                    select: { value: true }
                }
            }
        });

        const questionAnalytics = questions.map(question => {
            const answers = question.answers.map(a => a.value);
            let stats = {};

            switch (question.type) {
                case 'NUMBER':
                    const numericAnswers = answers.filter(a => !isNaN(a)).map(Number);
                    stats = {
                        average: numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length,
                        min: Math.min(...numericAnswers),
                        max: Math.max(...numericAnswers)
                    };
                    break;
                case 'CHECKBOX':
                    stats = {
                        checkedCount: answers.filter(a => a === 'true').length,
                        total: answers.length
                    };
                    break;
                default:
                    const answerCounts = answers.reduce((acc, val) => {
                        acc[val] = (acc[val] || 0) + 1;
                        return acc;
                    }, {});
                    stats = {
                        popularAnswers: Object.entries(answerCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                    };
            }

            return {
                questionId: question.id,
                questionTitle: question.title,
                type: question.type,
                stats
            };
        });

        const locations = await prisma.form.findMany({
            where: { templateId },
            select: {
                author: {
                    select: {
                        location: true
                    }
                }
            }
        });

        res.json({
            formCount,
            avgCompletionTime: avgCompletionTime._avg.completionTime,
            questionAnalytics,
            locations: locations.filter(l => l.author.location).map(l => l.author.location)
        });

    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/user/:userId', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        const forms = await prisma.form.findMany({
            where: { authorId: userId },
            include: {
                template: {
                    select: {
                        title: true
                    }
                },
                answers: true
            }
        });

        res.json({
            totalForms: forms.length,
            formsByTemplate: forms.reduce((acc, form) => {
                acc[form.template.title] = (acc[form.template.title] || 0) + 1;
                return acc;
            }, {}),
            activityTimeline: forms.map(f => ({
                date: f.createdAt,
                template: f.template.title
            }))
        });

    } catch (err) {
        console.error('User analytics error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/platform', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const [
            totalUsers,
            totalTemplates,
            totalForms,
            activeUsers,
            popularTemplates
        ] = await Promise.all([
            prisma.user.count(),
            prisma.template.count(),
            prisma.form.count(),
            prisma.user.count({
                where: {
                    lastActive: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            prisma.template.findMany({
                take: 5,
                orderBy: {
                    forms: {
                        _count: 'desc'
                    }
                },
                select: {
                    id: true,
                    title: true,
                    _count: {
                        select: { forms: true }
                    }
                }
            })
        ]);

        res.json({
            totalUsers,
            totalTemplates,
            totalForms,
            activeUsers,
            activePercentage: Math.round((activeUsers / totalUsers) * 100),
            popularTemplates
        });

    } catch (err) {
        console.error('Platform analytics error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
