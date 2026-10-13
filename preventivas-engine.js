/**
 * Módulo de Inteligência Preditiva e Comunicação SAMAPE 20
 * Cálculo de projeção de horímetros para pedreiras e geradores de templates (E-mail e WhatsApp)
 */

/**
 * Calcula quantidade de dias úteis entre duas datas
 * @param {Date|string} dataInicio 
 * @param {Date|string} dataFim 
 * @param {number} diasSemana - 5 (seg a sex) ou 6 (seg a sab)
 */
function calcularDiasUteis(dataInicio, dataFim, diasSemana = 5) {
  const ini = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (fim <= ini || isNaN(ini.getTime()) || isNaN(fim.getTime())) return 0;

  // Zerar horas para comparar apenas os dias de calendário
  const cur = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
  const end = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());

  let count = 0;
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay(); // 0 = Domingo, 6 = Sábado
    if (diasSemana === 6) {
      if (day !== 0) count++; // Domingo é folga
    } else {
      if (day !== 0 && day !== 6) count++; // Sábado e Domingo são folga
    }
  }
  return count;
}

/**
 * Adiciona dias úteis a uma data inicial
 */
function adicionarDiasUteis(dataInicio, diasUteis, diasSemana = 5) {
  const res = new Date(dataInicio);
  if (isNaN(res.getTime())) return new Date();
  
  let adicionados = 0;
  while (adicionados < diasUteis) {
    res.setDate(res.getDate() + 1);
    const day = res.getDay();
    if (diasSemana === 6) {
      if (day !== 0) adicionados++;
    } else {
      if (day !== 0 && day !== 6) adicionados++;
    }
  }
  return res;
}

/**
 * Calcula a projeção preditiva completa de uma máquina
 */
function calcularStatusPreditivo(maquina, ordens = []) {
  // 1. Determinar horímetro e data âncora
  const horimetroAncora = parseFloat(maquina.ultimo_horimetro_real || maquina.horas_uso || 0);
  
  let dataAncora = maquina.data_ultimo_horimetro 
    ? new Date(maquina.data_ultimo_horimetro) 
    : (maquina.updated_at ? new Date(maquina.updated_at) : (maquina.created_at ? new Date(maquina.created_at) : new Date()));
  
  if (isNaN(dataAncora.getTime())) {
    dataAncora = new Date();
  }

  const horasDia = parseFloat(maquina.horas_dia_estimadas) || 7.0;
  const diasSemana = parseInt(maquina.dias_semana_trabalho) || 5;

  // 2. Dias úteis passados desde a última leitura real até hoje
  const hoje = new Date();
  const diasUteisPassados = calcularDiasUteis(dataAncora, hoje, diasSemana);

  // 3. Horímetro estimado atual
  const horimetroEstimado = Math.round((horimetroAncora + (diasUteisPassados * horasDia)) * 10) / 10;

  // 4. Última revisão realizada
  let ultimaRevisaoHoras = maquina.ultima_revisao_horas ? parseFloat(maquina.ultima_revisao_horas) : null;
  let dataUltimaRevisao = maquina.data_ultima_revisao ? new Date(maquina.data_ultima_revisao) : null;

  // Se não foi informada explicitamente, busca nas ordens de serviço anteriores
  if (!ultimaRevisaoHoras && ordens.length > 0) {
    const osRevisao = ordens.find(o => 
      (o.descricao_problema && o.descricao_problema.toUpperCase().includes('REVISÃO')) ||
      (o.servicos_realizados && o.servicos_realizados.toUpperCase().includes('REVISÃO')) ||
      (o.diagnostico && o.diagnostico.toUpperCase().includes('REVISÃO'))
    );
    if (osRevisao && osRevisao.horimetro) {
      ultimaRevisaoHoras = parseFloat(String(osRevisao.horimetro).replace(',', '.')) || null;
      dataUltimaRevisao = new Date(osRevisao.data_fechamento || osRevisao.data_abertura);
    }
  }

  // 5. Determinar o próximo alvo de revisão (ciclos de 250h)
  let proximaRevisaoHoras = maquina.proxima_revisao_horas ? parseFloat(maquina.proxima_revisao_horas) : null;
  if (!proximaRevisaoHoras) {
    const base = ultimaRevisaoHoras || horimetroAncora;
    // Próximo múltiplo de 250
    proximaRevisaoHoras = Math.ceil((base + 1) / 250) * 250;
    if (proximaRevisaoHoras <= horimetroEstimado && (horimetroEstimado - proximaRevisaoHoras > 100)) {
      proximaRevisaoHoras = Math.ceil((horimetroEstimado + 1) / 250) * 250;
    }
  }

  // 6. Horas restantes e dias úteis restantes
  const horasRestantes = Math.round((proximaRevisaoHoras - horimetroEstimado) * 10) / 10;
  const diasRestantes = horasRestantes <= 0 ? 0 : Math.ceil(horasRestantes / horasDia);

  // 7. Data prevista para a revisão
  const dataPrevista = horasRestantes <= 0 ? hoje : adicionarDiasUteis(hoje, diasRestantes, diasSemana);

  // 8. Classificação de Semáforo
  let status = 'EM_DIA'; // 🟢
  let badgeCor = '#10b981'; // Verde
  let statusLabel = 'Em dia';

  if (horasRestantes <= 0) {
    status = 'VENCIDA'; // 🔴
    badgeCor = '#ef4444';
    statusLabel = 'Vencida';
  } else if (horasRestantes <= 40) {
    status = 'ATENCAO'; // 🟡
    badgeCor = '#f59e0b';
    statusLabel = 'Atenção';
  }

  // Progresso do ciclo
  const cicloTamanho = 250;
  const horasPercorridasNoCiclo = cicloTamanho - Math.max(0, horasRestantes);
  const progressoPercentual = Math.min(100, Math.max(0, Math.round((horasPercorridasNoCiclo / cicloTamanho) * 100)));

  return {
    horimetroAncora,
    dataAncora,
    horasDia,
    diasSemana,
    diasUteisPassados,
    horimetroEstimado,
    ultimaRevisaoHoras,
    dataUltimaRevisao,
    proximaRevisaoHoras,
    horasRestantes,
    diasRestantes,
    dataPrevista,
    status,
    badgeCor,
    statusLabel,
    progressoPercentual
  };
}

/**
 * Gera o template do e-mail informativo aos mecânicos
 */
function gerarTemplateEmailMecanicos(destinatarioNome = 'Equipe Técnica', maquinasAtencao = []) {
  const assunto = '🛠️ Informativo Técnico SAMAPE: A Força da Manutenção Preventiva Preditiva';
  
  let listaMaquinasHtml = '';
  if (maquinasAtencao && maquinasAtencao.length > 0) {
    listaMaquinasHtml = `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; margin: 18px 0;">
        <h4 style="margin: 0 0 10px 0; color: #b45309; font-size: 0.95em;">⚠️ Equipamentos Próximos de Revisão na Pedreira:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: #78350f;">
          ${maquinasAtencao.slice(0, 5).map(m => `
            <li><strong>${m.modelo} ${m.id_frota ? `(${m.id_frota})` : ''}</strong> — Cliente: ${m.cliente_nome || '-'} | Est: ~${m.preditivo?.horimetroEstimado || m.horas_uso}h (Faltam ${m.preditivo?.horasRestantes || 0}h)</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 22px; text-align: center;">
        <h2 style="margin: 0; font-size: 1.3em; letter-spacing: 0.5px;">SAMAPE — ENGENHARIA & MANUTENÇÃO</h2>
        <p style="margin: 6px 0 0 0; font-size: 0.9em; opacity: 0.9;">Boletim Técnico Operacional: Manutenção Preventiva Preditiva</p>
      </div>
      
      <div style="padding: 24px 26px; color: #334155; line-height: 1.6;">
        <p>Olá, <strong>${destinatarioNome}</strong> e Equipe Técnica,</p>
        
        <p>
          Na operação pesada de pedreira, cada minuto de máquina parada fora de hora representa prejuízos altos para o cliente e riscos para os operadores. Por isso, estamos fortalecendo nosso <strong>Plano de Manutenção Preventiva Preditiva</strong>.
        </p>
        
        <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 14px 16px; margin: 18px 0; border-radius: 0 4px 4px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 0.95em;">🎯 Por que a Preventiva Preditiva é Vital?</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
            <li><strong>Zero Paradas Inesperadas:</strong> Trocamos óleo e filtros antes do desgaste catastrófico da bomba hidráulica ou motor.</li>
            <li><strong>Segurança em Primeiro Lugar:</strong> Equipamento revisado evita falhas de freio, direção e estouro de mangueiras sob alta pressão em rampas.</li>
            <li><strong>Trabalho Planejado e Limpo:</strong> Você vai a campo com as ferramentas certas e o kit de peças completo, sem correria de emergência.</li>
          </ul>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 18px 0; border-radius: 0 4px 4px 0;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 0.95em;">⚡ Você é a Chave do Sistema:</h4>
          <p style="margin: 0; font-size: 0.9em; color: #78350f;">
            Como as pedreiras frequentemente não possuem sinal ou telemetria em tempo real, <strong>o mecânico é o verdadeiro sensor do sistema</strong>! 
            Sempre que visitar um equipamento, <strong>anote o horímetro exato no aplicativo da SAMAPE</strong>. É esse número que calibra os cálculos estatísticos e garante que a revisão seja feita na hora exata.
          </p>
        </div>

        ${listaMaquinasHtml}

        <p style="font-size: 0.85em; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          Contamos com a dedicação e o profissionalismo de cada um de vocês!<br>
          <strong>Equipe de Gestão e Engenharia — SAMAPE</strong>
        </p>
      </div>
    </div>
  `;

  return { assunto, html };
}

/**
 * Gera o template de e-mail ao cliente
 */
function gerarTemplateAlertaCliente(cliente, maquina, preditivo) {
  const clienteNome = cliente ? (cliente.nome || 'Cliente') : 'Cliente';
  const modeloStr = maquina.modelo || 'Equipamento';
  const frotaStr = maquina.id_frota ? `(Frota: ${maquina.id_frota})` : '';
  const assunto = `🚜 Acompanhamento Preventivo SAMAPE: ${modeloStr} ${frotaStr}`;

  const dataUltimaStr = preditivo.dataUltimaRevisao 
    ? new Date(preditivo.dataUltimaRevisao).toLocaleDateString('pt-BR') 
    : (preditivo.dataAncora ? new Date(preditivo.dataAncora).toLocaleDateString('pt-BR') : 'Não informada');
  
  const horimetroUltimoStr = preditivo.ultimaRevisaoHoras 
    ? `${preditivo.ultimaRevisaoHoras} h` 
    : `${preditivo.horimetroAncora} h`;

  const dataPrevistaStr = preditivo.dataPrevista 
    ? new Date(preditivo.dataPrevista).toLocaleDateString('pt-BR') 
    : 'A definir';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 1.35em; letter-spacing: 0.5px;">SAMAPE — ENGENHARIA & MANUTENÇÃO</h2>
        <p style="margin: 6px 0 0 0; font-size: 0.95em; opacity: 0.9;">Informativo de Monitoramento Preditivo de Frota</p>
      </div>

      <div style="padding: 24px 28px; color: #334155; line-height: 1.6;">
        <p style="font-size: 1.05em;">Prezado(a) <strong>${clienteNome}</strong>,</p>
        
        <p>
          Como parte do nosso compromisso contínuo com a máxima disponibilidade e segurança da sua operação, nossa equipe de engenharia acompanha o ciclo de trabalho do seu maquinário pesado na pedreira.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 1.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
            🚜 Status Operacional do Equipamento
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.92em;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Equipamento / Modelo:</strong></td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${modeloStr} ${frotaStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Última Manutenção Realizada:</strong></td>
              <td style="padding: 6px 0; text-align: right; color: #0f172a;">${dataUltimaStr} (${horimetroUltimoStr})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Horímetro Estimado Hoje:</strong></td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563eb;">~ ${preditivo.horimetroEstimado} h</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 8px 0; color: #b45309; font-weight: 700;">Próxima Revisão Recomendada:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #b45309;">Revisão ${preditivo.proximaRevisaoHoras}h</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Previsão de Atingimento:</strong></td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${dataPrevistaStr} (${preditivo.diasRestantes <= 0 ? 'Já atingido!' : `~ ${preditivo.diasRestantes} dias úteis`})</td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 18px 0; border-radius: 0 6px 6px 0;">
          <h4 style="margin: 0 0 6px 0; color: #1e40af; font-size: 0.95em;">💡 Por que planejar esta parada com antecedência?</h4>
          <p style="margin: 0; font-size: 0.9em; color: #334155;">
            Na rotina de pedreira, paradas corretivas emergenciais paralisam a cadeia produtiva (britagem e expedição), gerando perdas muito superiores ao custo da revisão. A substituição preventiva dos elementos filtrantes e fluidos térmicos protege componentes nobres (bombas de pistão, motores e transmissão) contra desgastes abrasivos provocados pela poeira severa de lavra.
          </p>
        </div>

        <p style="margin-top: 20px;">
          Nossa equipe técnica já está com o plano de revisão e kit de peças pré-dimensionado para este equipamento.
        </p>

        <div style="text-align: center; margin: 26px 0;">
          <a href="mailto:samapeindio.manutencao@gmail.com?subject=Confirmar Revisao ${encodeURIComponent(modeloStr + ' ' + frotaStr)}" 
             style="background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 0.95em; display: inline-block;">
            📅 Agendar / Confirmar Revisão Preventiva
          </a>
        </div>

        <p style="font-size: 0.85em; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          Atenciosamente,<br>
          <strong>Departamento Técnico e Engenharia de Frotas — SAMAPE</strong><br>
          Telefone: (28) 99941-0622 | E-mail: samapeindio.manutencao@gmail.com
        </p>
      </div>
    </div>
  `;

  return { assunto, html };
}

/**
 * Gera texto formatado para envio no WhatsApp ao cliente
 */
function gerarTextoWhatsAppCliente(cliente, maquina, preditivo) {
  const clienteNome = cliente ? (cliente.nome || 'Cliente') : 'Cliente';
  const modeloStr = maquina.modelo || 'Equipamento';
  const frotaStr = maquina.id_frota ? `(Frota: ${maquina.id_frota})` : '';
  const dataUltimaStr = preditivo.dataUltimaRevisao 
    ? new Date(preditivo.dataUltimaRevisao).toLocaleDateString('pt-BR') 
    : (preditivo.dataAncora ? new Date(preditivo.dataAncora).toLocaleDateString('pt-BR') : 'Não informada');
  const horimetroUltimoStr = preditivo.ultimaRevisaoHoras || preditivo.horimetroAncora;
  const dataPrevistaStr = preditivo.dataPrevista 
    ? new Date(preditivo.dataPrevista).toLocaleDateString('pt-BR') 
    : 'A definir';

  return `Olá *${clienteNome}*! 👋
Aqui é da *SAMAPE — Engenharia & Manutenção*.

Com base em nosso monitoramento preditivo para a sua operação de pedreira:

🚜 *Equipamento:* ${modeloStr} ${frotaStr}
⏱️ *Última Manutenção:* ${dataUltimaStr} (${horimetroUltimoStr} h)
📈 *Horímetro Estimado Hoje:* ~ *${preditivo.horimetroEstimado} h*
⚠️ *Próxima Revisão Recomendada:* *Revisão ${preditivo.proximaRevisaoHoras}h*
📅 *Previsão de Parada:* *${dataPrevistaStr}* (${preditivo.diasRestantes <= 0 ? 'Já atingido!' : `~ ${preditivo.diasRestantes} dias úteis`})

*Por que programar com antecedência?*
Evita parada inesperada na britagem/lavra e desgaste acelerado provocado pela poeira severa nos filtros e bombas.

Podemos agendar a visita da equipe técnica para esta revisão? Responda a esta mensagem para combinarmos o melhor dia! 🤝`;
}

/**
 * Gera texto formatado para envio no WhatsApp ao mecânico
 */
function gerarTextoWhatsAppMecanico(mecanico, maquinasAtencao = []) {
  const mecNome = mecanico ? (mecanico.nome || 'Equipe') : 'Equipe';

  let listaTexto = '';
  if (maquinasAtencao && maquinasAtencao.length > 0) {
    listaTexto = `\n🚜 *Máquinas com revisão próxima na pedreira:*\n` +
      maquinasAtencao.slice(0, 5).map(m => 
        `• *${m.modelo}* ${m.id_frota ? `(${m.id_frota})` : ''} — ${m.cliente_nome || '-'} | Est: ~${m.preditivo?.horimetroEstimado || m.horas_uso}h (Faltam ${m.preditivo?.horasRestantes || 0}h)`
      ).join('\n') + `\n`;
  }

  return `Fala *${mecNome}*! 👋
Aqui é da gestão técnica da *SAMAPE — Engenharia & Manutenção*.

Estamos fortalecendo nosso *Plano de Manutenção Preventiva Preditiva* nas pedreiras! 🚜💨

*Por que isso é fundamental para você e para a equipe?*
✅ *Zero Paradas Inesperadas:* Trocamos óleo e filtros antes que bombas hidráulicas ou motores fundam.
✅ *Segurança em Primeiro Lugar:* Evita estouro de mangueiras de alta pressão e falhas em rampas.
✅ *Trabalho Planejado:* Você vai a campo com ferramentas e kit de peças certos, sem correria de emergência.

⚠️ *Seu papel é o mais importante:*
Como a pedreira muitas vezes não tem sinal de celular, *você é o sensor do sistema*. Ao atender uma máquina, *sempre anote o horímetro exato no app da SAMAPE*. É esse número que calibra todo o nosso plano e protege a frota!
${listaTexto}
Contamos com você! Bom trabalho e boa jornada! 🤝🛠️`;
}

module.exports = {
  calcularDiasUteis,
  adicionarDiasUteis,
  calcularStatusPreditivo,
  gerarTemplateEmailMecanicos,
  gerarTemplateAlertaCliente,
  gerarTextoWhatsAppCliente,
  gerarTextoWhatsAppMecanico
};
