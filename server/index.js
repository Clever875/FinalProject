'use strict';
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { User, Template } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const PORT       = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Hello, world from Express backend!'));
app.get('/api/message', (req, res) => res.json({ message: 'Привет от сервера!' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.findAll({ where: { isPublic: true } });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось получить шаблоны' });
  }
});
app.post('/api/templates', auth, async (req, res) => {
  try {
    const { title, description, topic, imageUrl, isPublic } = req.body;
    const newTpl = await Template.create({
      title,
      description,
      topic,
      imageUrl: imageUrl || null,
      isPublic: isPublic ?? true,
      ownerId: req.user.id
    });
    res.status(201).json(newTpl);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
