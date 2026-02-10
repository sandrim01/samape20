# 🚀 SAMAPE ÍNDIO - API REST

API REST para o sistema de gerenciamento de manutenção SAMAPE ÍNDIO.

## 🔗 Endpoints

- `POST /api/login` - Autenticação
- `GET /api/clientes` - Listar clientes
- `GET /api/maquinas` - Listar máquinas
- `GET /api/ordens` - Listar ordens de serviço
- `GET /api/pecas` - Listar peças
- `GET /api/vendas` - Listar vendas
- `GET /api/stats` - Estatísticas
- `GET /api/health` - Health check

## 🔐 Autenticação

A API usa JWT (JSON Web Token) para autenticação.

**Login:**
```bash
POST /api/login
{
  "email": "admin@samapeop.com",
  "senha": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🗄️ Banco de Dados

PostgreSQL hospedado na Railway.

## 🚀 Deploy

Esta API está configurada para deploy automático na Railway.

## 📝 Variáveis de Ambiente

- `DATABASE_URL` - Connection string do PostgreSQL
- `JWT_SECRET` - Secret key para JWT
- `PORT` - Porta do servidor (padrão: 3000)

## 👤 Usuário Padrão

- Email: admin@samapeop.com
- Senha: admin123

## 📄 Licença

MIT
