'use strict';

const { init, DB_PATH } = require('./db');
const reset = process.argv.includes('--reset');

try {
  init({ reset });
  console.log(reset ? 'Base de datos re-creada' : 'Base de datos lista');
  console.log('Ubicación:', DB_PATH);
} catch (err) {
  console.error('Error inicializando la base de datos:', err.message);
  process.exit(1);
}