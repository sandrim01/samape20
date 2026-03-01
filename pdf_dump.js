async function gerarPDFOS(osId) {
  try {
    const result = await window.api.obterOS(osId);
    if (!result.success) {
      showAlert('Erro ao carregar dados da OS', 'danger');
      return;
    }

    const os = result.os;

    // Criar conte├║do HTML profissional para impress├úo
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>OS ${os.numero_os} - SAMAPEOP</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 15px;
            color: #333;
            line-height: 1.4;
            background: white;
            font-size: 11px;
          }
          
          /* HEADER COM LOGO */
          .document-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
          }
          
          .logo-container {
            margin-bottom: 8px;
          }
          
          .logo {
            width: 120px;
            height: auto;
          }
          
          .company-tagline {
            font-size: 0.75em;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .os-title {
            font-size: 1.3em;
            font-weight: 700;
            color: #1e293b;
            margin: 8px 0 5px 0;
          }
          
          .os-number {
            font-size: 1.5em;
            font-weight: 800;
            color: #2563eb;
            margin: 5px 0;
          }
          
          .os-dates {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 8px;
            font-size: 0.85em;
            color: #475569;
          }
          
          .os-dates strong {
            color: #1e293b;
          }
          
          /* SE├ç├òES */
          .section {
            margin: 12px 0;
            page-break-inside: avoid;
          }
          
          .section-header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 4px 4px 0 0;
            font-size: 0.95em;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .section-icon {
            font-size: 1.1em;
          }
          
          .section-body {
            border: 1px solid #e2e8f0;
            border-top: none;
            padding: 10px;
            border-radius: 0 0 4px 4px;
            background: #f8fafc;
          }
          
          /* GRID DE INFORMA├ç├òES */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          
          .info-grid-full {
            grid-column: 1 / -1;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          
          .info-label {
            font-weight: 700;
            color: #475569;
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .info-value {
            font-size: 0.9em;
            color: #1e293b;
            font-weight: 500;
            padding: 5px 8px;
            background: white;
            border-radius: 3px;
            border: 1px solid #e2e8f0;
          }
          
          /* TEXTAREA */
          .text-area {
            width: 100%;
            min-height: 60px;
            padding: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-family: inherit;
            font-size: 0.85em;
            line-height: 1.4;
            resize: none;
            background: white;
            color: #1e293b;
          }
          
          /* BOX DE VALORES */
          .values-summary {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px;
            margin: 8px 0;
          }
          
          .value-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .value-row:last-child {
            border-bottom: none;
          }
          
          .value-label {
            font-weight: 600;
            color: #475569;
            font-size: 0.9em;
          }
          
          .value-amount {
            font-weight: 700;
            color: #1e293b;
            font-size: 0.95em;
          }
          
          /* TOTAL BOX */
          .total-box {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 6px;
            margin: 15px 0;
          }
          
          .total-label {
            font-size: 0.85em;
            font-weight: 600;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            opacity: 0.95;
          }
          
          .total-amount {
            font-size: 2em;
            font-weight: 900;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          /* FOOTER */
          .document-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 0.75em;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0 10px 0;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #1e293b;
            margin: 40px 15px 6px 15px;
          }
          
          .signature-label {
            font-weight: 600;
            color: #475569;
            margin-top: 3px;
            font-size: 0.85em;
          }
          
          /* BOT├òES */
          .action-buttons {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 6px;
          }
          
          .btn {
            padding: 10px 25px;
            font-size: 0.9em;
            font-weight: 600;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            margin: 0 5px;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
          }
          
          .btn-secondary {
            background: #64748b;
            color: white;
          }
          
          .btn-secondary:hover {
            background: #475569;
          }
          
          /* PRINT STYLES */
          @media print {
            body { 
              padding: 10px;
              font-size: 10px;
            }
            
            .no-print { 
              display: none !important; 
            }
            
            .section {
              page-break-inside: avoid;
              margin: 8px 0;
            }
            
            .document-header {
              margin-bottom: 10px;
              padding-bottom: 8px;
            }
            
            .total-box {
              box-shadow: none;
              border: 2px solid #2563eb;
              padding: 12px;
              margin: 12px 0;
            }
            
            .signatures {
              margin: 15px 0 8px 0;
            }
            
            .signature-line {
              margin: 30px 10px 5px 10px;
            }
          }
          
          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <!-- HEADER COM LOGO -->
        <div class="document-header">
          <div class="logo-container">
            <img src="resources/logonova2.png" alt="SAMAPE ├ìNDIO" class="logo" style="width: 150px; height: auto;" onerror="this.style.display='none'" />
          </div>
          <div class="company-tagline">Sistema de Gerenciamento de Manuten├º├úo</div>
          
          <div class="os-title">ORDEM DE SERVI├çO</div>
          <div class="os-number">${os.numero_os}</div>
          
          <div class="os-dates">
            <span><strong>Abertura:</strong> ${formatDate(os.data_abertura)}</span>
            ${os.data_fechamento ? `<span><strong>Fechamento:</strong> ${formatDate(os.data_fechamento)}</span>` : ''}
            <span><strong>Status:</strong> <span style="color: ${os.status === 'FECHADA' ? '#10b981' : os.status === 'EM_ANDAMENTO' ? '#f59e0b' : '#2563eb'}; font-weight: 700;">${os.status.replace('_', ' ')}</span></span>
          </div>
        </div>

        <!-- CLIENTE -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒæñ</span>
            <span>Informa├º├Áes do Cliente</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome / Raz├úo Social</div>
                <div class="info-value">${os.cliente_nome}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CNPJ</div>
                <div class="info-value">${os.cliente_cnpj || 'N├úo informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${os.cliente_telefone || 'N├úo informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">E-mail</div>
                <div class="info-value">${os.cliente_email || 'N├úo informado'}</div>
              </div>
              <div class="info-item info-grid-full">
                <div class="info-label">Endere├ºo Completo</div>
                <div class="info-value">${os.cliente_endereco || 'N├úo informado'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- MAQUIN├üRIO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒÜ£</span>
            <span>Informa├º├Áes do Maquin├írio</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Modelo</div>
                <div class="info-value">${os.maquina_modelo}</div>
              </div>
              <div class="info-item">
                <div class="info-label">N├║mero de S├®rie</div>
                <div class="info-value">${os.maquina_serie || 'N├úo informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Ano de Fabrica├º├úo</div>
                <div class="info-value">${os.maquina_ano || 'N├úo informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tipo</div>
                <div class="info-value">${os.maquina_tipo || 'N├úo informado'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- MEC├éNICO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒæ¿ÔÇì­ƒöº</span>
            <span>Mec├ónico Respons├ível</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome do Mec├ónico</div>
                <div class="info-value">${os.mecanico_nome}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DESLOCAMENTO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒÜù</span>
            <span>Controle de Deslocamento</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">KM Ida</div>
                <div class="info-value">${os.km_ida.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">KM Volta</div>
                <div class="info-value">${os.km_volta.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">KM Total</div>
                <div class="info-value">${os.km_total.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">Valor por KM</div>
                <div class="info-value">R$ ${formatMoney(os.valor_por_km)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRI├ç├âO DO SERVI├çO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒôØ</span>
            <span>Descri├º├úo do Servi├ºo</span>
          </div>
          <div class="section-body">
            <div class="info-item" style="margin-bottom: 15px;">
              <div class="info-label">Problema Reportado</div>
              <textarea class="text-area" readonly>${os.descricao_problema}</textarea>
            </div>
            ${os.diagnostico ? `
              <div class="info-item" style="margin-bottom: 15px;">
                <div class="info-label">Diagn├│stico T├®cnico</div>
                <textarea class="text-area" readonly>${os.diagnostico}</textarea>
              </div>
            ` : ''}
            ${os.solucao ? `
              <div class="info-item">
                <div class="info-label">Solu├º├úo Aplicada</div>
                <textarea class="text-area" readonly>${os.solucao}</textarea>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- VALORES -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">­ƒÆ░</span>
            <span>Detalhamento de Valores</span>
          </div>
          <div class="section-body">
            <div class="values-summary">
              <div class="value-row">
                <span class="value-label">M├úo de Obra</span>
                <span class="value-amount">R$ ${formatMoney(os.valor_mao_obra)}</span>
              </div>
              <div class="value-row">
                <span class="value-label">Pe├ºas e Materiais</span>
                <span class="value-amount">R$ ${formatMoney(os.valor_pecas)}</span>
              </div>
              <div class="value-row">
                <span class="value-label">Deslocamento (${os.km_total.toFixed(1)} km ├ù R$ ${formatMoney(os.valor_por_km)})</span>
                <span class="value-amount">R$ ${formatMoney(os.valor_deslocamento)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TOTAL -->
        <div class="total-box">
          <div class="total-label">VALOR TOTAL DO SERVI├çO</div>
          <div class="total-amount">R$ ${formatMoney(os.valor_total)}</div>
        </div>

        ${os.observacoes ? `
          <!-- OBSERVA├ç├òES -->
          <div class="section">
            <div class="section-header">
              <span class="section-icon">­ƒôî</span>
              <span>Observa├º├Áes</span>
            </div>
            <div class="section-body">
              <textarea class="text-area" readonly>${os.observacoes}</textarea>
            </div>
          </div>
        ` : ''}

        <!-- ASSINATURAS -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do Cliente</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do Mec├ónico</div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="document-footer">
          <p><strong>SAMAPEOP</strong> - Sistema de Gerenciamento de Manuten├º├úo</p>
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} ├ás ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <!-- BOT├òES DE A├ç├âO -->
        <div class="action-buttons no-print">
          <button class="btn btn-primary" onclick="window.print()">
            ­ƒû¿´©Å Imprimir / Salvar como PDF
          </button>
          <button class="btn btn-secondary" onclick="window.close()">
            Ô£ò Fechar
          </button>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova janela para impress├úo
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showAlert('Erro ao gerar PDF', 'danger');
  }
}

