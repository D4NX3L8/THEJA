'use strict';

const express = require('express');
const path = require('node:path');
const { getDb } = require('./src/db');
const api = require('./src/api');

const app = express();
const PORT = process.env.PORT || 3000;

getDb();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', api);

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Solicitud con formato JSON inválido.' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`THEJA corriendo en http://localhost:${PORT}`);
});