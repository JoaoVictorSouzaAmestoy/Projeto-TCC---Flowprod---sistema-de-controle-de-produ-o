require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const path         = require('path');

const authRoutes        = require('./src/routes/auth');
const dadosRoutes       = require('./src/routes/dados');
const usuariosRoutes    = require('./src/routes/usuarios');
const senhaRoutes       = require('./src/routes/senha');
const pedidosRoutes     = require('./src/routes/pedidos');
const clientesRoutes    = require('./src/routes/clientes');
const notifRoutes       = require('./src/routes/notificacoes');
const alertasRoutes     = require('./src/routes/alertas');
const colaboradorRoutes      = require('./src/routes/colaborador');  // ← NOVO
const solicitacoesExecRoutes = require('./src/routes/solicitacoes-executor');
const { autenticar, autorizarFuncao } = require('./src/middlewares/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin:true, credentials:true }));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());

// ── API ────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/usuarios',    usuariosRoutes);
app.use('/api/senha',       senhaRoutes);
app.use('/api/pedidos',     pedidosRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/notificacoes', notifRoutes);
app.use('/api/alertas',     alertasRoutes);
app.use('/api/colaborador', colaboradorRoutes);  // ← NOVO
app.use('/api/solicitacoes-executor', solicitacoesExecRoutes);
app.use('/api', dadosRoutes);

// ── Páginas HTML ───────────────────────────────────────────
app.get('/',               (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/login.html',     (req,res) => res.sendFile(path.join(__dirname,'public','login.html')));
app.get('/primeiro-acesso.html', (req,res) => res.sendFile(path.join(__dirname,'public','primeiro-acesso.html')));
app.get('/cliente.html',   (req,res) => res.sendFile(path.join(__dirname,'public','cliente.html')));
app.get('/colaborador.html',(req,res) => res.sendFile(path.join(__dirname,'public','colaborador.html')));
app.get('/solicitar-acesso.html', (req,res) => res.sendFile(path.join(__dirname,'public','solicitar-acesso.html')));
app.get('/painel-alertas.html', (req,res) => res.sendFile(path.join(__dirname,'public','painel-alertas.html')));

app.get('/admin.html', autenticar, autorizarFuncao('ADMIN'), (req,res) =>
  res.sendFile(path.join(__dirname,'public','admin.html')));

['tela2','tela3','tela4','tela5','tela6','dashboard'].forEach(t =>
  app.get(`/${t}.html`, autenticar, (req,res) =>
    res.sendFile(path.join(__dirname,'public',`${t}.html`))));

app.get('/pedido.html', (req,res) => {
  const jwt = require('jsonwebtoken');
  const token = req.cookies?.token_cliente;
  if (!token) return res.redirect('/cliente.html');
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    if (p.tipo !== 'CLIENTE') return res.redirect('/cliente.html');
    res.sendFile(path.join(__dirname,'public','pedido.html'));
  } catch { res.redirect('/cliente.html'); }
});

app.use(express.static(path.join(__dirname,'public')));
app.use((req,res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.listen(PORT, () => {
  console.log(`\n🚀 FlowProd em http://localhost:${PORT}\n`);
  console.log('  /               → Landing page');
  console.log('  /login.html     → Login colaborador');
  console.log('  /colaborador.html → Primeiro acesso executor');
  console.log('  /cliente.html   → Área do cliente');
  console.log('  /admin.html     → Painel admin\n');
});
