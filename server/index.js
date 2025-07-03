const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const templatesRouter = require('./routes/templates');
const authRoutes = require('./routes/auth');
const sequelize = require('./db');
const formRoutes = require("./routes/forms");
require('dotenv').config();
const app = express();



app.use(cors());
app.use(express.json());
app.use('/api/tags', require('./routes/tags'));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/templates', templatesRouter);
app.use("/api/forms", formRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Unable to connect to DB:', err);
  });
