// src/routes/usuarios.js — Rotas de gerenciamento de executores
const express    = require('express');
const router     = express.Router();
const { autenticar, autorizarFuncao } = require('../middlewares/auth');
const { listar, criar, toggleAtivo, remover } = require('../controllers/usuariosController');

// Todas as rotas exigem login E função ADMIN
router.use(autenticar);
router.use(autorizarFuncao('ADMIN'));

// GET    /api/usuarios          — lista todos os executores
router.get('/', listar);

// POST   /api/usuarios          — cria novo executor
router.post('/', criar);

// PATCH  /api/usuarios/:id/toggle — ativa/desativa
router.patch('/:id/toggle', toggleAtivo);

// DELETE /api/usuarios/:id      — remove executor
router.delete('/:id', remover);

module.exports = router;
