const db = require('../db');
const { evContaCriada, logAdmin } = require('../notificar');

async function listar(req, res) {
  try {
    const r = await db.query(
      `SELECT id, nome, email, funcoes, ativo, criado_em FROM usuarios
       WHERE NOT ('ADMIN'=ANY(funcoes)) ORDER BY criado_em DESC`
    );
    return res.json({ usuarios: r.rows });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

async function criar(req, res) {
  const { nome, email, senha, funcoes } = req.body;
  if (!nome || !email || !senha || !funcoes?.length)
    return res.status(400).json({ erro: 'Nome, e-mail, senha e funções são obrigatórios.' });
  if (senha.length < 6)
    return res.status(400).json({ erro: 'Senha mínimo 6 caracteres.' });
  try {
    const r = await db.query(
      `INSERT INTO usuarios (nome, email, senha, funcoes)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [nome, email.toLowerCase().trim(), senha, funcoes]
    );
    const novoId = r.rows[0].id;

    // Evento: conta criada — aparece no sino no primeiro login
    await evContaCriada(novoId, nome, funcoes);
    await logAdmin(req.usuario.id, 'EXECUTOR_CRIADO',
      `${nome} (${email}) criado com módulos: ${funcoes.join(', ')}`
    );

    return res.status(201).json({
      mensagem: `Executor ${nome} criado!`,
      nome, email, senha, funcoes,
    });
  } catch(e) {
    if (e.code === '23505')
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    console.error('Erro criar executor:', e.message);
    return res.status(500).json({ erro: 'Erro interno ao criar executor.' });
  }
}

async function toggle(req, res) {
  try {
    const r = await db.query(
      `UPDATE usuarios SET ativo = NOT ativo WHERE id=$1
       RETURNING nome, ativo, email`,
      [req.params.id]
    );
    if (!r.rows.length)
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    const { nome, ativo, email } = r.rows[0];
    await logAdmin(req.usuario.id,
      ativo ? 'EXECUTOR_ATIVADO' : 'EXECUTOR_DESATIVADO',
      `${nome} (${email}) ${ativo ? 'ativado' : 'desativado'}`
    );
    return res.json({ mensagem: `${nome} ${ativo ? 'ativado' : 'desativado'}.`, ativo });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

async function remover(req, res) {
  try {
    const r = await db.query(
      `DELETE FROM usuarios WHERE id=$1 RETURNING nome, email`,
      [req.params.id]
    );
    if (!r.rows.length)
      return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const { nome, email } = r.rows[0];

    // Remove também o registro de solicitação vinculado ao e-mail,
    // senão o mesmo e-mail fica bloqueado para re-cadastro
    await db.query(
      `DELETE FROM solicitacoes_executor WHERE email = $1`,
      [email]
    );

    // Remove notificações do usuário deletado
    await db.query(`DELETE FROM notificacoes WHERE usuario_id = $1`, [req.params.id]);

    await logAdmin(req.usuario.id, 'EXECUTOR_REMOVIDO',
      `${nome} (${email}) removido`
    );
    return res.json({ mensagem: 'Executor removido.' });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

module.exports = { listar, criar, toggleAtivo: toggle, remover };
