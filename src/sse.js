// src/sse.js — Gerenciador de conexões SSE para notificações em tempo real
// Armazena clientes conectados por usuário_id
const clientes = new Map(); // { usuario_id: [res1, res2, ...] }

// Registra um novo cliente SSE
function registrarCliente(usuarioId, res) {
  if (!clientes.has(usuarioId)) {
    clientes.set(usuarioId, []);
  }
  clientes.get(usuarioId).push(res);
  console.log(`\n📡 [SSE] ✅ Cliente registrado: usuário_id=${usuarioId}`);
  console.log(`📊 [SSE] Conexões ativas: ${clientes.size} grupos de usuários`);
  
  // Remove cliente quando desconectar
  res.on('close', () => {
    const lista = clientes.get(usuarioId);
    if (lista) {
      const idx = lista.indexOf(res);
      if (idx !== -1) {
        lista.splice(idx, 1);
        console.log(`\n📡 [SSE] ❌ Cliente desconectado: usuário_id=${usuarioId}`);
      }
      if (lista.length === 0) {
        clientes.delete(usuarioId);
        console.log(`📊 [SSE] Conexões ativas: ${clientes.size} grupos de usuários\n`);
      }
    }
  });
}

// Envia notificação para um usuário específico
function enviarNotificacao(usuarioId, notificacao) {
  const lista = clientes.get(usuarioId);
  if (!lista) {
    console.log(`⚠️  [SSE] Usuário ${usuarioId} não tem conexão SSE ativa (offline)`);
    return;
  }
  
  const evento = `data: ${JSON.stringify(notificacao)}\n\n`;
  lista.forEach((res, idx) => {
    res.write(evento);
  });
  
  console.log(`\n📤 [SSE] ✉️  Notificação enviada para usuário ${usuarioId}`);
  console.log(`   Tipo: ${notificacao.tipo}`);
  console.log(`   Título: ${notificacao.titulo}`);
  console.log(`   Mensagem: ${notificacao.mensagem || 'sem mensagem'}\n`);
}

// Envia notificação para múltiplos usuários (ex: admins)
function enviarParaVarios(usuariosIds, notificacao) {
  console.log(`\n📤 [SSE] Enviando para ${usuariosIds.length} usuários...`);
  usuariosIds.forEach(id => enviarNotificacao(id, notificacao));
}

module.exports = { registrarCliente, enviarNotificacao, enviarParaVarios };
