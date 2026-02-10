# 🗄️ BANCO DE DADOS POSTGRESQL - SAMAPE ÍNDIO

## ✅ MIGRATIONS EXECUTADAS COM SUCESSO!

### 📊 **TABELAS CRIADAS:**

#### **1. usuarios** (Usuários do Sistema)
```sql
- id (SERIAL PRIMARY KEY)
- nome (VARCHAR 255)
- email (VARCHAR 255 UNIQUE)
- senha (VARCHAR 255 - hash bcrypt)
- cargo (ADMIN, DIRETOR, FINANCEIRO, VENDAS, MECANICO)
- ativo (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### **2. clientes** (Clientes)
```sql
- id (SERIAL PRIMARY KEY)
- nome, cnpj, cpf, telefone, email
- endereco, cidade, estado, cep
- observacoes
- ativo (BOOLEAN)
- created_at, updated_at
```

#### **3. maquinas** (Máquinas Agrícolas)
```sql
- id (SERIAL PRIMARY KEY)
- cliente_id (FK → clientes)
- tipo, modelo, numero_serie
- ano_fabricacao, horas_uso
- observacoes, ativo
- created_at, updated_at
```

#### **4. ordens_servico** (Ordens de Serviço)
```sql
- id (SERIAL PRIMARY KEY)
- numero_os (UNIQUE)
- cliente_id (FK → clientes)
- maquina_id (FK → maquinas)
- mecanico_id (FK → usuarios)
- data_abertura, data_fechamento
- status (ABERTA, EM_ANDAMENTO, AGUARDANDO_PECAS, FECHADA, CANCELADA)
- prioridade (BAIXA, MEDIA, ALTA, URGENTE)
- descricao_problema, diagnostico, servicos_realizados
- valor_mao_obra, valor_pecas, valor_total
- observacoes
- created_at, updated_at
```

#### **5. pecas** (Estoque de Peças)
```sql
- id (SERIAL PRIMARY KEY)
- codigo (UNIQUE), nome, descricao
- categoria, fabricante
- quantidade_estoque, estoque_minimo
- preco_custo, preco_venda
- localizacao, ativo
- created_at, updated_at
```

#### **6. os_pecas** (Peças Usadas nas OS)
```sql
- id (SERIAL PRIMARY KEY)
- os_id (FK → ordens_servico)
- peca_id (FK → pecas)
- quantidade, preco_unitario, preco_total
- created_at
```

#### **7. vendas** (Vendas de Peças)
```sql
- id (SERIAL PRIMARY KEY)
- numero_venda (UNIQUE)
- cliente_id (FK → clientes)
- vendedor_id (FK → usuarios)
- data_venda
- valor_total, desconto, valor_final
- forma_pagamento
- status (PENDENTE, PAGO, CANCELADO)
- observacoes
- created_at, updated_at
```

#### **8. venda_itens** (Itens de Venda)
```sql
- id (SERIAL PRIMARY KEY)
- venda_id (FK → vendas)
- peca_id (FK → pecas)
- quantidade, preco_unitario, preco_total
- created_at
```

#### **9. contas_receber** (Contas a Receber)
```sql
- id (SERIAL PRIMARY KEY)
- cliente_id (FK → clientes)
- os_id (FK → ordens_servico)
- venda_id (FK → vendas)
- descricao, valor
- data_vencimento, data_pagamento
- status (PENDENTE, PAGO, ATRASADO, CANCELADO)
- forma_pagamento, observacoes
- created_at, updated_at
```

#### **10. contas_pagar** (Contas a Pagar)
```sql
- id (SERIAL PRIMARY KEY)
- fornecedor, descricao, categoria
- valor
- data_vencimento, data_pagamento
- status (PENDENTE, PAGO, ATRASADO, CANCELADO)
- forma_pagamento, observacoes
- created_at, updated_at
```

---

## 🔗 **CONEXÃO COM O BANCO:**

### **Dados de Conexão:**
```
Host: shinkansen.proxy.rlwy.net
Port: 47179
Database: railway
User: postgres
Password: kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ
```

### **Connection String:**
```
postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway
```

---

## 👤 **USUÁRIO PADRÃO CRIADO:**

```
Email: admin@samapeop.com
Senha: admin123
Cargo: ADMIN
```

---

## 📋 **ÍNDICES CRIADOS (Performance):**

```sql
- idx_clientes_cnpj
- idx_clientes_cpf
- idx_maquinas_cliente
- idx_os_cliente
- idx_os_maquina
- idx_os_status
- idx_os_data
- idx_pecas_codigo
- idx_vendas_cliente
- idx_contas_receber_status
- idx_contas_pagar_status
```

---

## 🔄 **RELACIONAMENTOS:**

```
clientes (1) → (N) maquinas
clientes (1) → (N) ordens_servico
clientes (1) → (N) vendas
clientes (1) → (N) contas_receber

maquinas (1) → (N) ordens_servico

ordens_servico (1) → (N) os_pecas
ordens_servico (1) → (N) contas_receber

pecas (1) → (N) os_pecas
pecas (1) → (N) venda_itens

vendas (1) → (N) venda_itens
vendas (1) → (N) contas_receber

usuarios (1) → (N) ordens_servico (mecânico)
usuarios (1) → (N) vendas (vendedor)
```

---

## 🛠️ **ARQUIVOS CRIADOS:**

1. **`.env`** - Variáveis de ambiente
2. **`migrations.js`** - Script de migrations
3. **`BANCO-DE-DADOS.md`** - Esta documentação

---

## 🚀 **COMO EXECUTAR MIGRATIONS NOVAMENTE:**

```bash
node migrations.js
```

**OBS:** O script é idempotente (pode rodar várias vezes sem problemas)

---

## 📊 **ESTATÍSTICAS:**

- **Total de Tabelas:** 10
- **Total de Índices:** 11
- **Total de Foreign Keys:** 15
- **Usuários Iniciais:** 1 (admin)

---

## 🔐 **SEGURANÇA:**

- ✅ Senhas com hash bcrypt
- ✅ Conexão SSL com Railway
- ✅ Foreign Keys com CASCADE
- ✅ Constraints de validação
- ✅ Índices para performance

---

## 📝 **PRÓXIMOS PASSOS:**

1. ✅ Migrations executadas
2. ⏳ Integrar aplicação com PostgreSQL
3. ⏳ Migrar dados do SQLite (se necessário)
4. ⏳ Testar CRUD completo
5. ⏳ Deploy da aplicação

---

**Criado em:** 09/02/2026  
**Banco:** PostgreSQL 15+ (Railway)  
**Status:** ✅ Operacional
