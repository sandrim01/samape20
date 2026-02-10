const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados
const dbPath = path.join(process.env.APPDATA || process.env.HOME, 'samapeop', 'samapeop-data.json');

console.log('📂 Caminho do banco:', dbPath);

// Carregar banco existente
let db;
try {
    const data = fs.readFileSync(dbPath, 'utf8');
    db = JSON.parse(data);
    console.log('✅ Banco de dados carregado');
} catch (error) {
    console.error('❌ Erro ao carregar banco:', error.message);
    process.exit(1);
}

// Dados fake para popular
const clientesFake = [
    {
        nome: 'Fazenda Santa Maria',
        cnpj: '12.345.678/0001-90',
        telefone: '(16) 3234-5678',
        email: 'contato@fazendasantamaria.com.br',
        endereco: 'Rodovia SP-330, Km 245, Zona Rural',
        cidade: 'Ribeirão Preto',
        estado: 'SP'
    },
    {
        nome: 'Agropecuária Boa Vista Ltda',
        cnpj: '23.456.789/0001-01',
        telefone: '(16) 3345-6789',
        email: 'financeiro@boavista.com.br',
        endereco: 'Estrada Municipal BV-100, s/n',
        cidade: 'Sertãozinho',
        estado: 'SP'
    },
    {
        nome: 'Cooperativa Agrícola Regional',
        cnpj: '34.567.890/0001-12',
        telefone: '(16) 3456-7890',
        email: 'cooperativa@car.coop.br',
        endereco: 'Av. dos Agricultores, 1500',
        cidade: 'Jaboticabal',
        estado: 'SP'
    },
    {
        nome: 'Fazenda Três Irmãos',
        cnpj: '45.678.901/0001-23',
        telefone: '(16) 3567-8901',
        email: 'adm@tresirmaos.agr.br',
        endereco: 'Fazenda Três Irmãos, Zona Rural',
        cidade: 'Cravinhos',
        estado: 'SP'
    },
    {
        nome: 'Usina São José S.A.',
        cnpj: '56.789.012/0001-34',
        telefone: '(16) 3678-9012',
        email: 'manutencao@usinasaojose.com.br',
        endereco: 'Rodovia Anhanguera, Km 320',
        cidade: 'Guariba',
        estado: 'SP'
    }
];

const maquinasFake = [
    // Fazenda Santa Maria
    { tipo: 'TRATOR', modelo: 'John Deere 6175R', numero_serie: 'JD6175R-2022-001', ano: 2022, cliente_id: null },
    { tipo: 'COLHEITADEIRA', modelo: 'Case IH Axial-Flow 9240', numero_serie: 'CASE9240-2021-045', ano: 2021, cliente_id: null },
    { tipo: 'PULVERIZADOR', modelo: 'Jacto Uniport 3030', numero_serie: 'JACTO3030-2023-012', ano: 2023, cliente_id: null },

    // Agropecuária Boa Vista
    { tipo: 'TRATOR', modelo: 'Massey Ferguson 7415', numero_serie: 'MF7415-2020-089', ano: 2020, cliente_id: null },
    { tipo: 'PLANTADEIRA', modelo: 'Semeato PSE 8', numero_serie: 'SEME8-2022-034', ano: 2022, cliente_id: null },

    // Cooperativa Agrícola
    { tipo: 'COLHEITADEIRA', modelo: 'New Holland CR8.90', numero_serie: 'NH8.90-2023-007', ano: 2023, cliente_id: null },
    { tipo: 'TRATOR', modelo: 'Valtra BH180', numero_serie: 'VALTRA180-2021-056', ano: 2021, cliente_id: null },

    // Fazenda Três Irmãos
    { tipo: 'TRATOR', modelo: 'John Deere 5090E', numero_serie: 'JD5090E-2019-123', ano: 2019, cliente_id: null },
    { tipo: 'GRADE', modelo: 'Baldan GAICR 32x28', numero_serie: 'BALD32-2020-078', ano: 2020, cliente_id: null },

    // Usina São José
    { tipo: 'COLHEITADEIRA', modelo: 'Case IH A8800', numero_serie: 'CASEA8800-2022-019', ano: 2022, cliente_id: null },
    { tipo: 'TRATOR', modelo: 'New Holland T7.290', numero_serie: 'NHT7290-2023-003', ano: 2023, cliente_id: null },
    { tipo: 'PULVERIZADOR', modelo: 'Montana Parruda 3027', numero_serie: 'MONT3027-2021-067', ano: 2021, cliente_id: null }
];

const problemas = [
    'Motor apresentando perda de potência',
    'Vazamento de óleo hidráulico',
    'Sistema de freios com baixa eficiência',
    'Ruído anormal na transmissão',
    'Superaquecimento do motor',
    'Falha no sistema elétrico',
    'Embreagem patinando',
    'Direção hidráulica com folga',
    'Sistema de ar condicionado não funciona',
    'Pneus desgastados necessitando troca'
];

const diagnosticos = [
    'Filtro de ar obstruído e injeção desregulada',
    'Mangueira hidráulica rompida no cilindro principal',
    'Pastilhas de freio desgastadas e fluido contaminado',
    'Rolamento do eixo principal com desgaste',
    'Radiador com obstrução e válvula termostática travada',
    'Alternador com defeito e bateria descarregada',
    'Disco de embreagem desgastado além do limite',
    'Bomba hidráulica com vazamento interno',
    'Compressor do ar condicionado sem gás refrigerante',
    'Pneus com desgaste irregular por desalinhamento'
];

const solucoes = [
    'Substituição do filtro de ar e regulagem da injeção eletrônica',
    'Troca da mangueira hidráulica e reposição do fluido',
    'Substituição das pastilhas e troca completa do fluido de freio',
    'Substituição do rolamento e lubrificação do conjunto',
    'Limpeza do radiador e troca da válvula termostática',
    'Instalação de novo alternador e recarga da bateria',
    'Substituição completa do kit de embreagem',
    'Recondicionamento da bomba hidráulica',
    'Recarga do sistema de ar condicionado e teste de vazamentos',
    'Substituição dos 4 pneus e alinhamento da direção'
];

// Função para gerar data aleatória nos últimos 90 dias
function randomDate(daysBack = 90) {
    const now = new Date();
    const past = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000));
    return past.toISOString();
}

// Função para valor aleatório
function randomValue(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

// Popular clientes
console.log('\n📋 Adicionando clientes...');
const clientesAdicionados = [];
clientesFake.forEach(cliente => {
    db.counters.clientes++;
    const novoCliente = {
        id: db.counters.clientes,
        ...cliente,
        ativo: 1,
        criado_em: randomDate(180)
    };
    db.clientes.push(novoCliente);
    clientesAdicionados.push(novoCliente);
    console.log(`  ✓ ${cliente.nome}`);
});

// Popular máquinas
console.log('\n🚜 Adicionando máquinas...');
const maquinasAdicionadas = [];
maquinasFake.forEach((maquina, index) => {
    db.counters.maquinas++;
    const clienteIndex = Math.floor(index / (maquinasFake.length / clientesAdicionados.length));
    const novaMaquina = {
        id: db.counters.maquinas,
        ...maquina,
        cliente_id: clientesAdicionados[clienteIndex].id,
        ativo: 1,
        criado_em: randomDate(150)
    };
    db.maquinas.push(novaMaquina);
    maquinasAdicionadas.push(novaMaquina);
    console.log(`  ✓ ${maquina.modelo} (${clientesAdicionados[clienteIndex].nome})`);
});

// Buscar mecânicos
const mecanicos = db.usuarios.filter(u => u.cargo === 'MECANICO' || u.cargo === 'ADMIN');
if (mecanicos.length === 0) {
    console.log('\n⚠️  Nenhum mecânico encontrado. Criando mecânico de teste...');
    db.counters.usuarios++;
    const mecanicoTeste = {
        id: db.counters.usuarios,
        nome: 'João Silva',
        email: 'joao.silva@samapeop.com',
        senha: bcrypt.hashSync('mecanico123', 10),
        cargo: 'MECANICO',
        ativo: 1,
        criado_em: new Date().toISOString()
    };
    db.usuarios.push(mecanicoTeste);
    mecanicos.push(mecanicoTeste);
    console.log('  ✓ João Silva (Mecânico)');
}

// Popular ordens de serviço
console.log('\n📋 Adicionando ordens de serviço...');
const statusOptions = ['ABERTA', 'EM_ANDAMENTO', 'FECHADA'];

for (let i = 0; i < 15; i++) {
    db.counters.ordens_servico++;

    const maquina = maquinasAdicionadas[Math.floor(Math.random() * maquinasAdicionadas.length)];
    const cliente = clientesAdicionados.find(c => c.id === maquina.cliente_id);
    const mecanico = mecanicos[Math.floor(Math.random() * mecanicos.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    const problemaIdx = Math.floor(Math.random() * problemas.length);
    const kmIda = parseFloat(randomValue(10, 150));
    const kmVolta = parseFloat(randomValue(10, 150));
    const valorPorKm = 3.50;
    const valorMaoObra = parseFloat(randomValue(200, 1500));
    const valorPecas = parseFloat(randomValue(100, 3000));

    const kmTotal = kmIda + kmVolta;
    const valorDeslocamento = kmTotal * valorPorKm;
    const valorTotal = valorMaoObra + valorPecas + valorDeslocamento;

    const dataCriacao = randomDate(60);
    const dataFechamento = status === 'FECHADA' ?
        new Date(new Date(dataCriacao).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() :
        null;

    const novaOS = {
        id: db.counters.ordens_servico,
        numero_os: `OS-${String(db.counters.ordens_servico).padStart(6, '0')}`,
        cliente_id: cliente.id,
        maquina_id: maquina.id,
        mecanico_id: mecanico.id,
        descricao_problema: problemas[problemaIdx],
        diagnostico: status !== 'ABERTA' ? diagnosticos[problemaIdx] : null,
        solucao: status === 'FECHADA' ? solucoes[problemaIdx] : null,
        observacoes: status === 'FECHADA' ? 'Serviço executado conforme procedimento padrão. Cliente satisfeito.' : null,
        km_ida: kmIda,
        km_volta: kmVolta,
        km_total: kmTotal,
        valor_por_km: valorPorKm,
        valor_deslocamento: valorDeslocamento,
        valor_mao_obra: valorMaoObra,
        valor_pecas: valorPecas,
        valor_total: valorTotal,
        status: status,
        data_abertura: dataCriacao,
        data_fechamento: dataFechamento,
        criado_em: dataCriacao
    };

    db.ordens_servico.push(novaOS);
    console.log(`  ✓ ${novaOS.numero_os} - ${cliente.nome} - ${maquina.modelo} [${status}]`);
}

// Salvar banco de dados
try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('\n✅ Banco de dados atualizado com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • ${clientesAdicionados.length} clientes adicionados`);
    console.log(`   • ${maquinasAdicionadas.length} máquinas adicionadas`);
    console.log(`   • 15 ordens de serviço criadas`);
    console.log('\n🎉 Dados de teste populados com sucesso!');
} catch (error) {
    console.error('\n❌ Erro ao salvar banco:', error.message);
    process.exit(1);
}
