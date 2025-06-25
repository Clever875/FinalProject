const express = require('express');
const cors = require('cors');

const { Template } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world from Express backend!');
});
app.get('/api/message', (req, res) => {
  res.json({ message: 'Привет от сервера!' });
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.findAll({ where: { isPublic: true } });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось получить шаблоны' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { title, description, topic, imageUrl, isPublic } = req.body;
    const newTpl = await Template.create({
      title,
      description,
      topic,
      imageUrl: imageUrl || null,
      isPublic: isPublic ?? true,
      ownerId: 1
    });
    res.status(201).json(newTpl);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
