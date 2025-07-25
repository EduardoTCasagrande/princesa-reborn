const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const resHelper = require('./helpers/res');
const estoqueRoutes = require('./routes/estoqueRoutes');
const skuRoutes = require('./routes/skuRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cuponsRoutes = require('./routes/cuponsRoutes');
const certificatesRoutes = require('./routes/certificadosRoutes');


//const user = require('./helpers/user')

const app = express();
const PORT = 3000;
app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));

//app.use(user('2025-07-05T15:10:00'));

// Criar diretório de relatórios se não existir
const relatoriosDir = path.join(__dirname, 'relatorios');
if (!fs.existsSync(relatoriosDir)) {
  fs.mkdirSync(relatoriosDir, { recursive: true });
}

// Configurar EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares globais
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'uma-chave-secreta-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 36000000 }
}));

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 5,                  
  message: { status: 'erro', mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/login', loginLimiter);

// Rotas
app.use('/', require('./routes/authRoutes'));
app.use('/reposicao', require('./routes/reposicaoRoutes'));
app.use('/', require('./routes/relatorioRoutes'));
app.use('/', require('./routes/vendaRoutes'));
app.use('/', require('./routes/quiosqueRoutes'));
app.use('/', require('./routes/precoRoutes'));
app.use('/', require('./routes/caixaRoutes'));
app.use('/', require('./routes/usuarioRoutes'));
app.use('/', require('./routes/skuRoutes'));
app.use('/', dashboardRoutes);
app.use(cuponsRoutes);
app.use('/certificados', certificatesRoutes);
app.use('/relatorios', express.static(path.join(__dirname, 'relatorios')));




app.use('/cupons', express.static(path.join(__dirname, 'cupons')));
app.use(estoqueRoutes);

// Página 404
app.use((req, res) => {
  resHelper.paginaNaoEncontrada(res);
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
