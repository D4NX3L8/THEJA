'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'theja.db');
const SCHEMA = path.join(DB_DIR, 'schema.sql');

let db;

function getDb() {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  if (!hasTables()) {
    applySchema();
  }
  return db;
}

function hasTables() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get();
  return row.n > 0;
}

function applySchema() {
  db.exec(fs.readFileSync(SCHEMA, 'utf8'));
}

// Permite re-crear la base desde cero: node src/init.js --reset
function init({ reset = false } = {}) {
  if (reset && fs.existsSync(DB_PATH)) {
    fs.rmSync(DB_PATH, { force: true });
    fs.rmSync(DB_PATH + '-wal', { force: true });
    fs.rmSync(DB_PATH + '-shm', { force: true });
    db = undefined;
  }
  const instance = getDb();
  applySchema();
  return instance;
}

module.exports = { getDb, init, DB_PATH };