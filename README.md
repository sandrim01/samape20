# SAMAPEOP - Sistema de Gerenciamento de Manutenção de Maquinário Pesado

## 📋 Descrição

Sistema Desktop completo para gerenciamento de empresas de manutenção de maquinário pesado, com controle de acesso baseado em cargos (RBAC), módulos separados para operacional, financeiro e vendas.

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação e Privilégios

O sistema possui 5 níveis de acesso:

1. **ADMIN (Administrador/TI)** - Acesso total ao sistema
2. **DIRETOR** - Visualização de todos os módulos e relatórios
3. **FINANCEIRO** - Acesso ao módulo financeiro e clientes
4. **VENDAS** - Acesso ao módulo de vendas de peças e estoque
5. **MECANICO** - Acesso ao módulo operacional (Ordens de Serviço)

### 📦 Módulos do Sistema

#### 1. **Dashboard**
- Estatísticas em tempo real
- Ordens de serviço abertas e em andamento
- Contas a receber e pagar pendentes
- Alertas de estoque baixo
- Vendas do mês

#### 2. **Operacional (Mecânicos)**
- **Ordens de Serviço (OS)**
  - Criar nova OS com número automático
  - Vincular cliente e máquina
  - Atribuir mecânico responsável
  - Registrar problema, diagnóstico e solução
  - Controle de status (ABERTA, EM_ANDAMENTO, FECHADA)
  - Cálculo automático de valores

- **Máquinas**
  - Cadastro de máquinas por cliente
  - Modelo, número de série, ano
  - Histórico de manutenções

#### 3. **Vendas de Peças**
- Cadastro de peças com código único
- Controle de estoque (atual e mínimo)
- Preço de custo e venda
- Registro de vendas
- Baixa automática de estoque
- Alertas de estoque baixo

#### 4. **Financeiro**
- **Contas a Receber**
  - Vinculadas a OS ou vendas
  - Controle de vencimento
  - Registro de pagamentos
  - Status (PENDENTE/PAGO)

- **Contas a Pagar**
  - Fornecedores
  - Categorias (Salários, Aluguel, etc.)
  - Controle de vencimento
  - Registro de pagamentos

#### 5. **Cadastros**
- **Clientes**
  - Nome, CNPJ, telefone, e-mail
  - Endereço completo
  
- **Usuários** (apenas ADMIN)
  - Criação de novos usuários
  - Definição de cargos
  - Ativação/desativação

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (v14 ou superior)
- Windows 10/11

### Instalação

1. As dependências já foram instaladas. Se precisar reinstalar:
```bash
npm install
```

2. Executar o aplicativo:
```bash
npm start
```

### Primeiro Acesso

**Usuário padrão:**
- E-mail: `admin@samapeop.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha do administrador após o primeiro acesso!

## 🏗️ Estrutura do Projeto

```
SAMAPEOP/
├── main.js              # Processo principal do Electron + Backend
├── preload.js           # Bridge seguro entre frontend e backend
├── index.html           # HTML principal
├── styles.css           # Estilos modernos com tema dark
├── app.js               # Lógica frontend e interface
├── resources/           # Recursos (ícones, imagens)
│   └── icon.svg
├── package.json         # Configurações e dependências
└── samapeop-data.json   # Banco de dados (criado automaticamente)
```

## 💾 Banco de Dados

O sistema utiliza um banco de dados JSON local (`samapeop-data.json`) que é criado automaticamente na primeira execução. O arquivo fica localizado em:

```
C:\Users\[SEU_USUARIO]\AppData\Roaming\samapeop\samapeop-data.json
```

### Backup

Para fazer backup do sistema, copie o arquivo `samapeop-data.json` para um local seguro.

## 🎨 Interface

- **Design Moderno**: Interface dark com gradientes e animações suaves
- **Responsiva**: Adapta-se a diferentes tamanhos de tela
- **Intuitiva**: Navegação clara e organizada por módulos
- **Profissional**: Cores corporativas e tipografia moderna

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Isolamento de contexto (Context Isolation)
- Validação de permissões em todas as operações
- Sem acesso direto ao Node.js pelo frontend

## 📊 Relatórios e Estatísticas

O Dashboard apresenta:
- Total de OS abertas e em andamento
- Valor total a receber (pendente)
- Valor total a pagar (pendente)
- Peças com estoque abaixo do mínimo
- Total de vendas do mês atual

## 🛠️ Tecnologias Utilizadas

- **Electron** - Framework para aplicativos desktop
- **Node.js** - Backend JavaScript
- **Vanilla JavaScript** - Frontend sem frameworks
- **CSS3** - Estilos modernos com variáveis CSS
- **bcryptjs** - Criptografia de senhas
- **JSON** - Armazenamento de dados

## 📝 Fluxo de Trabalho Típico

### Para Mecânicos:
1. Login no sistema
2. Visualizar OS atribuídas
3. Criar nova OS para um cliente
4. Atualizar status e diagnóstico
5. Fechar OS quando concluída

### Para Vendas:
1. Login no sistema
2. Verificar estoque de peças
3. Registrar venda de peças
4. Sistema baixa estoque automaticamente

### Para Financeiro:
1. Login no sistema
2. Visualizar contas a receber/pagar
3. Registrar pagamentos
4. Acompanhar fluxo de caixa

### Para Administrador:
1. Acesso total a todos os módulos
2. Criar novos usuários
3. Gerenciar permissões
4. Visualizar relatórios gerenciais

## 🐛 Solução de Problemas

### O aplicativo não inicia
1. Verifique se o Node.js está instalado: `node --version`
2. Reinstale as dependências: `npm install`
3. Tente executar: `npm start`

### Erro de permissão no PowerShell
Execute o PowerShell como Administrador e rode:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Esqueci a senha do administrador
1. Localize o arquivo `samapeop-data.json`
2. Faça backup do arquivo
3. Delete o arquivo original
4. Reinicie o aplicativo (criará novo usuário admin padrão)

## 📈 Próximas Melhorias Sugeridas

- [ ] Relatórios em PDF
- [ ] Gráficos de desempenho
- [ ] Backup automático
- [ ] Integração com e-mail
- [ ] Aplicativo mobile complementar
- [ ] Importação/exportação de dados
- [ ] Histórico de alterações (audit log)
- [ ] Notificações de vencimento

## 📄 Licença

Sistema proprietário desenvolvido para SAMAPEOP.

## 👥 Suporte

Para suporte técnico, entre em contato com o departamento de TI.

---

**Desenvolvido com ❤️ para otimizar a gestão de manutenção de maquinário pesado**
