# 🏗️ ASC Inventário — Guia Completo de Arquitetura & Backend

## Stack Tecnológica

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Backend | Node.js + Express | Leve, rápido, vasto ecossistema |
| Banco de Dados | PostgreSQL | Multi-tenant, JSONB, robusto |
| Autenticação | JWT + bcrypt | Stateless, seguro |
| ORM | Prisma | Type-safe, migrations automáticas |
| Frontend | React + Vite | SPA moderna, rápida |
| Estilização | CSS-in-JS / Tailwind | Flexível |

---

## 📁 Estrutura de Pastas

```
asc-inventario/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── companyController.js
│   │   │   ├── userController.js
│   │   │   └── assetController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # Validação JWT
│   │   │   └── tenantGuard.js   # Isolamento multi-tenant
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── companies.js
│   │   │   ├── users.js
│   │   │   └── assets.js
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Modelagem do banco
│   │   └── app.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   └── App.jsx
    └── package.json
```

---

## 🗄️ Modelagem do Banco (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id           String   @id @default(cuid())
  razaoSocial  String
  nomeFantasia String
  cnpj         String   @unique
  endereco     String?
  cidade       String?
  estado       String?
  cep          String?
  telefone     String?
  email        String?
  responsavel  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  users  User[]
  assets Asset[]
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     @default(USER)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
}

model Asset {
  id          String   @id @default(cuid())
  tipo        String
  nome        String
  fabricante  String?
  modelo      String?
  patrimonio  String?
  localizacao String?
  responsavel String?
  status      Status   @default(ATIVO)
  dataCompra  DateTime?
  garantiaAte DateTime?
  observacoes String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
}

enum Role {
  MASTER  // ASC admin total
  ADMIN   // Admin da empresa
  USER    // Usuário comum
}

enum Status {
  ATIVO
  ESTOQUE
  MANUTENCAO
  INATIVO
}
```

---

## 🔐 Backend — Código Principal

### `backend/src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/assets',    require('./routes/assets'));

app.listen(process.env.PORT || 3001, () => {
  console.log('🚀 ASC Inventário API rodando na porta 3001');
});
```

### `backend/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

### `backend/src/middleware/tenantGuard.js`

```javascript
// Garante que usuários só acessem dados da própria empresa
module.exports = (req, res, next) => {
  if (req.user.role === 'MASTER') return next(); // Master acessa tudo

  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (companyId && companyId !== req.user.companyId) {
    return res.status(403).json({ error: 'Acesso negado — dados de outra empresa' });
  }

  // Injeta companyId automaticamente para queries
  req.tenantId = req.user.companyId;
  next();
};
```

### `backend/src/controllers/authController.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Verifica usuário master (ASC Informática)
  if (email === process.env.MASTER_EMAIL) {
    const match = await bcrypt.compare(password, process.env.MASTER_HASH);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: 'master', role: 'MASTER', name: 'ASC Informática' },
      process.env.JWT_SECRET, { expiresIn: '8h' }
    );
    return res.json({ token, user: { id: 'master', name: 'ASC Informática', role: 'MASTER' } });
  }

  // Busca usuário no banco
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: { select: { id: true, nomeFantasia: true } } }
  });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!user.active) return res.status(403).json({ error: 'Usuário inativo' });

  const token = jwt.sign(
    { id: user.id, role: user.role, companyId: user.companyId, name: user.name },
    process.env.JWT_SECRET, { expiresIn: '8h' }
  );

  res.json({ token, user: { ...user, password: undefined } });
};

exports.recoverPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Em produção: enviar e-mail com link de recuperação usando nodemailer
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Reset token para ${email}: ${resetToken}`);
    // await sendResetEmail(email, resetToken);
  }

  // Sempre responde OK (segurança: não revela se e-mail existe)
  res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });
};
```

### `backend/src/controllers/assetController.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const { status, tipo, search } = req.query;

  // Multi-tenant: master vê tudo, empresa vê só os seus
  const where = {
    ...(req.user.role !== 'MASTER' && { companyId: req.tenantId }),
    ...(status && status !== 'Todos' && { status: status.toUpperCase() }),
    ...(tipo && tipo !== 'Todos' && { tipo }),
    ...(search && {
      OR: [
        { nome: { contains: search, mode: 'insensitive' } },
        { fabricante: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
        { patrimonio: { contains: search, mode: 'insensitive' } },
      ]
    })
  };

  const assets = await prisma.asset.findMany({
    where,
    include: { company: { select: { nomeFantasia: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.json(assets);
};

exports.create = async (req, res) => {
  const companyId = req.user.role === 'MASTER' ? req.body.companyId : req.tenantId;

  const asset = await prisma.asset.create({
    data: { ...req.body, companyId }
  });

  res.status(201).json(asset);
};

exports.update = async (req, res) => {
  const { id } = req.params;

  // Verifica se o ativo pertence à empresa do usuário
  if (req.user.role !== 'MASTER') {
    const existing = await prisma.asset.findFirst({
      where: { id, companyId: req.tenantId }
    });
    if (!existing) return res.status(404).json({ error: 'Ativo não encontrado' });
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: req.body
  });

  res.json(asset);
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'MASTER') {
    const existing = await prisma.asset.findFirst({
      where: { id, companyId: req.tenantId }
    });
    if (!existing) return res.status(404).json({ error: 'Ativo não encontrado' });
  }

  await prisma.asset.delete({ where: { id } });
  res.json({ success: true });
};

exports.exportCSV = async (req, res) => {
  const where = req.user.role !== 'MASTER' ? { companyId: req.tenantId } : {};
  const assets = await prisma.asset.findMany({ where, include: { company: true } });

  const header = 'Tipo,Nome,Fabricante,Modelo,Patrimônio,Localização,Responsável,Status,Data Compra,Garantia,Empresa\n';
  const rows = assets.map(a =>
    `${a.tipo},"${a.nome}","${a.fabricante||''}","${a.modelo||''}",${a.patrimonio||''},` +
    `"${a.localizacao||''}","${a.responsavel||''}",${a.status},${a.dataCompra||''},` +
    `${a.garantiaAte||''},"${a.company.nomeFantasia}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=inventario.csv');
  res.send('\uFEFF' + header + rows); // BOM para Excel reconhecer UTF-8
};
```

---

## 🌐 Rotas da API

```
POST   /api/auth/login              → Login
POST   /api/auth/recover            → Recuperação de senha

GET    /api/companies               → Listar empresas (master)
POST   /api/companies               → Criar empresa (master)
PUT    /api/companies/:id           → Editar empresa (master)
DELETE /api/companies/:id           → Excluir empresa (master)

GET    /api/users                   → Listar usuários (da empresa)
POST   /api/users                   → Criar usuário
PUT    /api/users/:id               → Editar usuário
DELETE /api/users/:id               → Excluir usuário

GET    /api/assets                  → Listar ativos (filtros)
POST   /api/assets                  → Criar ativo
PUT    /api/assets/:id              → Editar ativo
DELETE /api/assets/:id              → Excluir ativo
GET    /api/assets/export/csv       → Exportar CSV
```

---

## ⚙️ Arquivo `.env`

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/asc_inventario"
JWT_SECRET="sua-chave-secreta-muito-segura-aqui"
FRONTEND_URL="http://localhost:5173"
PORT=3001
MASTER_EMAIL="admin@ascinformatica.com.br"
MASTER_HASH="$2a$10$..." # bcrypt hash da senha master
```

---

## 🚀 Como Rodar o Sistema

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clonar e instalar
```bash
git clone https://github.com/asc/inventario
cd asc-inventario

# Backend
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar banco de dados
```bash
# Criar banco no PostgreSQL
createdb asc_inventario

# Configurar .env com a URL do banco
cp .env.example .env

# Rodar migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Seed inicial (usuário master)
```bash
# No backend
node src/seed.js
```

### 4. Rodar
```bash
# Terminal 1 - Backend
cd backend && npm run dev   # Porta 3001

# Terminal 2 - Frontend
cd frontend && npm run dev  # Porta 5173
```

---

## 🔒 Segurança Implementada

| Camada | Proteção |
|--------|----------|
| Senhas | bcrypt com salt rounds 10 |
| Tokens | JWT com expiração de 8h |
| Rotas | Middleware de autenticação em todas as rotas privadas |
| Multi-tenant | tenantGuard injeta companyId automaticamente |
| SQL Injection | Prisma ORM (queries parametrizadas) |
| Rate Limit | 100 req/15min por IP |
| CORS | Apenas domínio do frontend |
| Headers | Helmet.js (segurança HTTP) |

---

## 📦 Dependências Backend

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "nodemon": "^3.0.0"
  }
}
```

---

*ASC Informática — Sistema de Inventário v2.0*
