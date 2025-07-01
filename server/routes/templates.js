const express = require('express');
const router = express.Router();
const { Template } = require('../models');
const auth = require('../middleware/auth');

router.get('/public', async (req, res) => {
  try {
    const templates = await Template.findAll({ where: { isPublic: true } });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка запроса' });
  }
});

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const templates = await Template.findAll({ where: { ownerId: req.user.id } });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, topic, imageUrl, isPublic } = req.body;
    const template = await Template.create({
      title,
      description,
      topic,
      imageUrl,
      isPublic,
      ownerId: req.user.id
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (template.ownerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (template.ownerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { title, description, topic, imageUrl, isPublic } = req.body;
    await template.update({ title, description, topic, imageUrl, isPublic });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (template.ownerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
