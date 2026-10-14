// ==================== MÓDULO QR-CODE: SCANNER & GERADOR DE ETIQUETAS ====================

// Som de sucesso ao escanear usando Web Audio API
function playQRSuccessTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Silencioso se áudio não for permitido
  }
}

// ==================== 1. SCANNER DE QR-CODE (MOBILE & DESKTOP) ====================

let _qrScannerStream = null;
let _qrScannerAnimFrame = null;
let _qrScannerTorchOn = false;
let _qrScannerCurrentFacing = 'environment';

// Obter usuário logado de forma resiliente
function obterUsuarioLogado() {
  if (typeof AppState !== 'undefined' && AppState && AppState.currentUser) {
    return AppState.currentUser;
  }
  if (window.AppState && window.AppState.currentUser) {
    return window.AppState.currentUser;
  }
  if (typeof API_CONFIG !== 'undefined' && API_CONFIG && typeof API_CONFIG.getUser === 'function') {
    const u = API_CONFIG.getUser();
    if (u) return u;
  }
  if (window.API_CONFIG && typeof window.API_CONFIG.getUser === 'function') {
    const u = window.API_CONFIG.getUser();
    if (u) return u;
  }
  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info') ||
                localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

async function abrirScannerQRCode() {
  // Fechar qualquer scanner pré-existente
  fecharScannerQRCode();

  const scannerHTML = `
    <div id="modal-qr-scanner-overlay" style="
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10, 15, 29, 0.95); z-index: 99999;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 1rem; box-sizing: border-box; font-family: inherit;
    ">
      
      <!-- Top Bar -->
      <div style="width: 100%; max-width: 500px; display: flex; justify-content: space-between; align-items: center; color: white;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 1.5rem;">📷</span>
          <div>
            <div style="font-weight: 800; font-size: 1.1rem; letter-spacing: 0.02em;">LEITOR DE QR-CODE</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Aponte para a máquina para criar a OS</div>
          </div>
        </div>
        <button onclick="fecharScannerQRCode()" style="
          background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.2);
          color: white; border-radius: 50%; width: 40px; height: 40px; font-size: 1.3rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        ">&times;</button>
      </div>

      <!-- Viewfinder Central -->
      <div style="position: relative; width: 100%; max-width: 360px; aspect-ratio: 1; border-radius: 20px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
        <video id="qr-scanner-video" playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
        <canvas id="qr-scanner-canvas" style="display: none;"></canvas>

        <!-- Moldura com cantos e laser animado -->
        <div style="position: absolute; inset: 24px; border: 2px dashed rgba(56, 189, 248, 0.6); border-radius: 16px; pointer-events: none; box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.35);">
          <!-- Cantos destacados -->
          <div style="position: absolute; top: -2px; left: -2px; width: 24px; height: 24px; border-top: 4px solid #38bdf8; border-left: 4px solid #38bdf8; border-top-left-radius: 12px;"></div>
          <div style="position: absolute; top: -2px; right: -2px; width: 24px; height: 24px; border-top: 4px solid #38bdf8; border-right: 4px solid #38bdf8; border-top-right-radius: 12px;"></div>
          <div style="position: absolute; bottom: -2px; left: -2px; width: 24px; height: 24px; border-bottom: 4px solid #38bdf8; border-left: 4px solid #38bdf8; border-bottom-left-radius: 12px;"></div>
          <div style="position: absolute; bottom: -2px; right: -2px; width: 24px; height: 24px; border-bottom: 4px solid #38bdf8; border-right: 4px solid #38bdf8; border-bottom-right-radius: 12px;"></div>
          
          <!-- Linha Laser animada -->
          <div id="qr-laser-line" style="
            position: absolute; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, transparent, #38bdf8, #60a5fa, transparent);
            box-shadow: 0 0 12px #38bdf8;
            animation: qrScanLaser 2s ease-in-out infinite alternate;
          "></div>
        </div>

        <!-- Indicador de Status / Carregando -->
        <div id="qr-scanner-loading" style="position: absolute; background: rgba(15, 23, 42, 0.85); color: white; padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          <span>⏳</span> <span>Iniciando câmera...</span>
        </div>
      </div>

      <!-- Controles Inferiores -->
      <div style="width: 100%; max-width: 500px; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        
        <div style="font-size: 0.85rem; color: #cbd5e1; text-align: center; font-weight: 500;">
          Mantenha o código dentro da mira para criar a OS instantaneamente
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; width: 100%;">
          <!-- Botão Lanterna (Torch) -->
          <button id="btn-qr-torch" onclick="toggleQRTorch()" style="
            padding: 0.65rem 1rem; border-radius: 10px; background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 0.85rem;
            cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
          ">
            <span>🔦</span> <span>Lanterna</span>
          </button>

          <!-- Botão Trocar Câmera -->
          <button onclick="alternarCameraQR()" style="
            padding: 0.65rem 1rem; border-radius: 10px; background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 0.85rem;
            cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
          ">
            <span>🔄</span> <span>Virar Câmera</span>
          </button>

          <!-- Botão Carregar Foto -->
          <label style="
            padding: 0.65rem 1rem; border-radius: 10px; background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 0.85rem;
            cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
          ">
            <span>📁</span> <span>Foto da Galeria</span>
            <input type="file" accept="image/*" style="display: none;" onchange="lerQRCodeDeArquivo(event)">
          </label>
        </div>

        <button onclick="fecharScannerQRCode()" style="
          margin-top: 0.25rem; width: 100%; max-width: 250px; padding: 0.75rem;
          border-radius: 10px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5; font-weight: 700; cursor: pointer;
        ">
          Cancelar Leitura
        </button>

      </div>

    </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-qr-scanner';
  div.innerHTML = scannerHTML;
  document.body.appendChild(div);

  iniciarCameraQR(_qrScannerCurrentFacing);
}

// Inicia a câmera
async function iniciarCameraQR(facingMode = 'environment') {
  const video = document.getElementById('qr-scanner-video');
  const loading = document.getElementById('qr-scanner-loading');
  if (!video) return;

  try {
    if (_qrScannerStream) {
      _qrScannerStream.getTracks().forEach(t => t.stop());
    }

    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    _qrScannerStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = _qrScannerStream;
    await video.play();

    if (loading) loading.style.display = 'none';

    // Iniciar loop de leitura
    loopScannerQR();

  } catch (err) {
    console.error('Erro ao acessar câmera:', err);
    if (loading) {
      loading.innerHTML = `<span style="color: #ef4444;">⚠️ Não foi possível abrir a câmera: ${err.message || 'Sem permissão'}. Use o botão de foto abaixo.</span>`;
    }
  }
}

// Alterna entre câmera frontal e traseira
function alternarCameraQR() {
  _qrScannerCurrentFacing = _qrScannerCurrentFacing === 'environment' ? 'user' : 'environment';
  iniciarCameraQR(_qrScannerCurrentFacing);
}

// Alterna lanterna se suportado
async function toggleQRTorch() {
  if (!_qrScannerStream) return;
  const track = _qrScannerStream.getVideoTracks()[0];
  if (!track) return;

  const caps = track.getCapabilities ? track.getCapabilities() : {};
  if (!caps.torch) {
    alert('Lanterna não disponível nesta câmera.');
    return;
  }

  try {
    _qrScannerTorchOn = !_qrScannerTorchOn;
    await track.applyConstraints({
      advanced: [{ torch: _qrScannerTorchOn }]
    });
    const btn = document.getElementById('btn-qr-torch');
    if (btn) {
      btn.style.background = _qrScannerTorchOn ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)';
    }
  } catch (e) {
    console.warn('Erro ao ligar lanterna:', e);
  }
}

// Loop contínuo de varredura do frame
async function loopScannerQR() {
  const video = document.getElementById('qr-scanner-video');
  const canvas = document.getElementById('qr-scanner-canvas');
  if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
    _qrScannerAnimFrame = requestAnimationFrame(loopScannerQR);
    return;
  }

  let codeFound = null;

  // 1. Tentar API nativa do navegador (BarcodeDetector)
  if ('BarcodeDetector' in window) {
    try {
      const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(video);
      if (barcodes && barcodes.length > 0) {
        codeFound = barcodes[0].rawValue;
      }
    } catch (e) {
      // Falha fallback para jsQR
    }
  }

  // 2. Se BarcodeDetector não achou ou não é suportado, usar jsQR
  if (!codeFound && typeof jsQR === 'function') {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    if (code && code.data) {
      codeFound = code.data;
    }
  }

  if (codeFound) {
    tratarConteudoQRCode(codeFound);
    return; // Para o loop
  }

  _qrScannerAnimFrame = requestAnimationFrame(loopScannerQR);
}

// Trata leitura vinda de arquivo de imagem
function lerQRCodeDeArquivo(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      let codeFound = null;

      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes && barcodes.length > 0) codeFound = barcodes[0].rawValue;
        } catch (err) {}
      }

      if (!codeFound && typeof jsQR === 'function') {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) codeFound = code.data;
      }

      if (codeFound) {
        tratarConteudoQRCode(codeFound);
      } else {
        alert('Não foi possível identificar um QR-Code nesta imagem. Tente uma foto mais nítida.');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Fecha o scanner e desliga a câmera
function fecharScannerQRCode() {
  if (_qrScannerAnimFrame) {
    cancelAnimationFrame(_qrScannerAnimFrame);
    _qrScannerAnimFrame = null;
  }
  if (_qrScannerStream) {
    _qrScannerStream.getTracks().forEach(t => t.stop());
    _qrScannerStream = null;
  }
  const el = document.getElementById('container-modal-qr-scanner');
  if (el) el.remove();
}

// Interpreta o conteúdo do QR-Code lido
async function tratarConteudoQRCode(rawText) {
  let data = null;

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    // Caso seja formato texto com prefixo simples ex: SAMAPE:MAQ:12
    if (rawText.startsWith('SAMAPE:MAQ:')) {
      const maqId = parseInt(rawText.replace('SAMAPE:MAQ:', ''));
      data = { app: 'samape', tipo: 'maquina', id: maqId };
    }
  }

  // Validação do QR-Code
  if (!data || (!data.id && !data.maquina_id)) {
    alert('QR-Code não reconhecido como uma máquina do sistema SAMAPE.');
    // Retoma o loop se ainda estiver aberto
    _qrScannerAnimFrame = requestAnimationFrame(loopScannerQR);
    return;
  }

  // Feedback sonoro e vibração
  playQRSuccessTone();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  // Fechar câmera
  fecharScannerQRCode();

  // Executar criação instantânea da OS
  await processarLeituraQRCodeECriarOS(data);
}

// ==================== 2. CRIAÇÃO AUTOMÁTICA DA OS E CONFIRMAÇÃO ====================

async function processarLeituraQRCodeECriarOS(qrData) {
  const maquinaId = qrData.id || qrData.maquina_id;

  // Modal com indicador de progresso rápido
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'qr-loading-os';
  loadingOverlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 100000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: white; font-family: inherit;
  `;
  loadingOverlay.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border); padding: 2rem; border-radius: var(--radius-xl); text-align: center; max-width: 380px; width: 90%;">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem; animation: pulse 1s infinite alternate;">⚙️</div>
      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: var(--text-primary);">Máquina Reconhecida!</h3>
      <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Criando Ordem de Serviço vinculada ao seu usuário...</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  try {
    // 1. Obter dados completos da máquina
    const maquinasLista = (typeof AppState !== 'undefined' && AppState && AppState.data && AppState.data.maquinas) ? AppState.data.maquinas : [];
    let maquina = maquinasLista.find(m => m.id === maquinaId);
    if (!maquina) {
      const resMaq = await window.api.obterMaquina(maquinaId);
      if (resMaq && resMaq.success) {
        maquina = resMaq.maquina;
      }
    }

    if (!maquina) {
      loadingOverlay.remove();
      alert(`Máquina ID ${maquinaId} não encontrada no banco de dados.`);
      return;
    }

    // 2. Dados do Mecânico (Usuário Atual)
    const usuario = obterUsuarioLogado();
    const mecanicoId = usuario ? usuario.id : null;
    const mecanicoNome = usuario ? (usuario.nome || 'Mecânico') : 'Mecânico';

    // 3. Montar dados da Nova OS pré-preenchida
    const clienteId = maquina.cliente_id || qrData.cliente_id;
    const modeloNome = maquina.modelo || qrData.modelo || 'Equipamento';
    const idFrotaTexto = maquina.id_frota ? ` (Frota: ${maquina.id_frota})` : '';
    const horimetroAtual = maquina.horas_uso ? `${maquina.horas_uso} h` : '';
    const dataExecucaoHoje = new Date().toISOString().split('T')[0];

    const novaOSDados = {
      cliente_id: clienteId,
      maquina_id: maquina.id,
      mecanico_id: mecanicoId,
      status: 'ABERTA',
      prioridade: 'MEDIA',
      horimetro: horimetroAtual,
      data_execucao: dataExecucaoHoje,
      descricao_problema: `Atendimento iniciado via leitura de QR-Code na máquina ${modeloNome}${idFrotaTexto}. Aguardando apontamento de serviços.`
    };

    // 4. Salvar OS diretamente no banco de dados
    const result = await window.api.criarOS(novaOSDados);

    loadingOverlay.remove();

    if (!result.success) {
      alert('Erro ao criar Ordem de Serviço: ' + (result.message || 'Falha no servidor'));
      return;
    }

    // Atualizar dados de ordens e estatísticas em segundo plano
    if (typeof loadOrdens === 'function') loadOrdens();
    if (typeof carregarDadosIniciais === 'function') carregarDadosIniciais();

    const ordemCriada = result.ordem;
    const numeroOS = result.numero_os || ordemCriada.numero_os;

    // 5. Exibir Modal de Sucesso com Escolha Operacional
    exibirModalSucessoOS(ordemCriada.id, numeroOS, maquina, mecanicoNome, !!result._isOffline);

  } catch (error) {
    loadingOverlay.remove();
    console.error('Erro ao processar QR-Code da máquina:', error);
    alert('Erro ao processar OS: ' + error.message);
  }
}

// Modal exibido após a OS ser criada com sucesso no banco (ou salva no aparelho offline)
function exibirModalSucessoOS(osId, numeroOS, maquina, mecanicoNome, isOffline = false) {
  const clienteNome = maquina.cliente_nome || 'Cliente Vinculado';
  const ehOffline = isOffline || String(osId).startsWith('temp_');

  const modalHTML = `
    <div id="modal-sucesso-os-qr" style="
      position: fixed; inset: 0; background: rgba(10, 15, 29, 0.85); z-index: 99999;
      display: flex; align-items: center; justify-content: center; padding: 1.25rem; font-family: inherit;
    ">
      <div style="
        background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl);
        max-width: 460px; width: 100%; box-shadow: var(--shadow-xl); overflow: hidden;
        animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        
        <!-- Header de Sucesso (Verde para Online / Âmbar para Offline) -->
        <div style="background: ${ehOffline ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'linear-gradient(135deg, #065f46 0%, #059669 100%)'}; color: white; padding: 1.5rem; text-align: center;">
          <div style="font-size: 2.8rem; margin-bottom: 0.25rem;">${ehOffline ? '📡' : '✅'}</div>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 800;">
            ${ehOffline ? 'OS Provisória Salva no Aparelho!' : 'OS Criada com Sucesso!'}
          </h3>
          <div style="display: inline-block; margin-top: 0.5rem; background: rgba(0,0,0,0.25); padding: 4px 14px; border-radius: 12px; font-weight: 800; font-size: 1.1rem; letter-spacing: 0.5px;">
            ${ehOffline ? 'OS PENDENTE ' + numeroOS : numeroOS}
          </div>
        </div>

        <!-- Corpo com Resumo dos Dados Pré-Preenchidos -->
        <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem;">
          
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Máquina:</span>
              <strong style="color: var(--text-primary);">${maquina.modelo} ${maquina.id_frota ? `[Frota: ${maquina.id_frota}]` : ''}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Cliente:</span>
              <span style="color: var(--text-primary); font-weight: 500;">${clienteNome}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Mecânico:</span>
              <span style="color: var(--text-primary); font-weight: 500;">${mecanicoNome}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Horímetro Atual:</span>
              <span style="color: var(--primary-light); font-weight: 700;">${maquina.horas_uso ? `${maquina.horas_uso} h` : 'Não registrado'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Status:</span>
              <span class="badge ${ehOffline ? 'badge-warning' : 'badge-success'}" style="font-size: 0.75rem;">
                ${ehOffline ? 'SALVA OFFLINE' : 'ABERTA'}
              </span>
            </div>
          </div>

          <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); text-align: center; line-height: 1.35;">
            ${ehOffline 
              ? 'Seu aparelho está sem internet. Os dados foram gravados na fila local com segurança e serão sincronizados automaticamente assim que você tiver sinal.'
              : 'A ordem já está salva no banco. Você pode completar a descrição dos serviços agora ou realizar o trabalho e editá-la mais tarde.'}
          </p>

          <!-- Ações de Escolha -->
          <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.5rem;">
            <!-- Opção 1: Preencher Agora -->
            <button 
              class="btn btn-primary" 
              onclick="fecharModalSucessoOS(); mostrarModalOS('${osId}')"
              style="padding: 0.85rem; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
            >
              <span>✏️</span> <span>Preencher / Editar OS Agora</span>
            </button>

            <!-- Opção 2: Editar Mais Tarde -->
            <button 
              class="btn btn-secondary" 
              onclick="fecharModalSucessoOS()"
              style="padding: 0.75rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
            >
              <span>⏱️</span> <span>Continuar e Editar Mais Tarde</span>
            </button>
          </div>

        </div>

      </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-sucesso-os';
  div.innerHTML = modalHTML;
  document.body.appendChild(div);
}

function fecharModalSucessoOS() {
  const el = document.getElementById('container-modal-sucesso-os');
  if (el) el.remove();
}

// ==================== 3. GERADOR DE ETIQUETA / QR-CODE DA MÁQUINA ====================

async function gerarQRCodeMaquina(maquinaId) {
  // Modal de Carregando
  const loading = document.createElement('div');
  loading.id = 'loading-qr-gen';
  loading.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; color:white; font-weight:600; font-family:inherit;';
  loading.innerHTML = '<span>⏳ Gerando QR-Code em alta resolução...</span>';
  document.body.appendChild(loading);

  try {
    const res = await window.api.obterQRCodeMaquina(maquinaId);
    loading.remove();

    if (!res || !res.success) {
      alert('Erro ao gerar QR-Code: ' + (res?.message || 'Falha no servidor'));
      return;
    }

    const { maquina, qrcode } = res;
    abrirModalVisualizarQRCode(maquina, qrcode);

  } catch (error) {
    loading.remove();
    console.error('Erro ao gerar QR-Code:', error);
    alert('Erro ao gerar QR-Code: ' + error.message);
  }
}

// Renderiza o modal e constrói a etiqueta gráfica em Canvas
function abrirModalVisualizarQRCode(maquina, qrcodeDataUrl) {
  const modalHTML = `
    <div id="modal-preview-qrcode" style="
      position: fixed; inset: 0; background: rgba(10, 15, 29, 0.85); z-index: 99999;
      display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: inherit;
    ">
      <div style="
        background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl);
        max-width: 480px; width: 100%; max-height: 95vh; overflow-y: auto; box-shadow: var(--shadow-xl);
        display: flex; flex-direction: column;
      ">
        
        <!-- Header -->
        <div style="background: var(--bg-secondary); padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; color: var(--text-primary);">
            <span>📱</span> <span>Etiqueta QR-Code da Máquina</span>
          </div>
          <button onclick="fecharModalPreviewQRCode()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <!-- Conteúdo: Visualização da Etiqueta -->
        <div style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem;">
          
          <div id="canvas-badge-container" style="
            background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            overflow: hidden; max-width: 320px; width: 100%; border: 1px solid #cbd5e1;
          ">
            <canvas id="canvas-etiqueta-maquina" style="width: 100%; height: auto; display: block;"></canvas>
          </div>

          <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); text-align: center;">
            Fixe esta etiqueta adesiva no painel ou cabine do equipamento. Ao apontar o celular, a OS é criada instantaneamente.
          </p>

          <!-- Botões de Ação -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%;">
            <button 
              class="btn btn-primary" 
              onclick="baixarEtiquetaPNG('${maquina.modelo}', '${maquina.id_frota || ''}')"
              style="padding: 0.75rem; font-size: 0.9rem; font-weight: 700;"
            >
              <span>📥</span> <span>Baixar PNG</span>
            </button>

            <button 
              class="btn btn-secondary" 
              onclick="imprimirEtiquetaQRCode()"
              style="padding: 0.75rem; font-size: 0.9rem; font-weight: 600;"
            >
              <span>🖨️</span> <span>Imprimir</span>
            </button>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: var(--bg-secondary); padding: 0.85rem 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
          <button class="btn btn-outline" onclick="fecharModalPreviewQRCode()">Fechar</button>
        </div>

      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-preview-qrcode';
  div.innerHTML = modalHTML;
  document.body.appendChild(div);

  // Desenhar etiqueta gráfica no Canvas
  desenharEtiquetaNoCanvas(maquina, qrcodeDataUrl);
}

function fecharModalPreviewQRCode() {
  const el = document.getElementById('container-modal-preview-qrcode');
  if (el) el.remove();
}

// Desenha a etiqueta completa com Logo, Dados da Máquina e QR Code
function desenharEtiquetaNoCanvas(maquina, qrcodeDataUrl) {
  const canvas = document.getElementById('canvas-etiqueta-maquina');
  if (!canvas) return;

  const width = 600;
  const height = 750;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Fundo Branco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Barra de Cabeçalho Superior Grafite
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, 80);

  // Título do Cabeçalho
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMAPE ÍNDIO • GESTÃO DE MÁQUINAS', width / 2, 48);

  // Modelo do Equipamento (Destaque Principal)
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(maquina.modelo || 'MÁQUINA', width / 2, 135);

  // ID de Frota e Número de Série
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 24px Inter, Arial, sans-serif';
  const frotaTxt = maquina.id_frota ? `FROTA: ${maquina.id_frota}` : '';
  const serieTxt = maquina.numero_serie ? `S/N: ${maquina.numero_serie}` : '';
  const subInfo = [frotaTxt, serieTxt].filter(Boolean).join('  •  ') || 'EQUIPAMENTO REGISTRADO';
  ctx.fillText(subInfo, width / 2, 175);

  // Cliente
  if (maquina.cliente_nome) {
    ctx.fillStyle = '#475569';
    ctx.font = '500 18px Inter, Arial, sans-serif';
    ctx.fillText(`Cliente: ${maquina.cliente_nome}`, width / 2, 208);
  }

  // Divisória sutil
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 225);
  ctx.lineTo(width - 40, 225);
  ctx.stroke();

  // Desenhar QR-Code Central
  const qrImg = new Image();
  qrImg.onload = () => {
    const qrSize = 340;
    const qrX = (width - qrSize) / 2;
    const qrY = 245;

    // Borda ao redor do QR-Code
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Instruções no Rodapé
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APONTE A CÂMERA NO APP SAMAPE', width / 2, 645);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px Inter, Arial, sans-serif';
    ctx.fillText('⚡ Abertura instantânea de Ordem de Serviço', width / 2, 678);

    // Barra decorativa inferior
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, height - 12, width, 12);
  };
  qrImg.src = qrcodeDataUrl;
}

// Download do arquivo PNG
function baixarEtiquetaPNG(modelo, idFrota) {
  const canvas = document.getElementById('canvas-etiqueta-maquina');
  if (!canvas) return;

  const nomeLimpo = `${modelo}_${idFrota}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.download = `etiqueta-qr-${nomeLimpo || 'maquina'}.png`;
  a.href = canvas.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Impressão da Etiqueta
function imprimirEtiquetaQRCode() {
  const canvas = document.getElementById('canvas-etiqueta-maquina');
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up bloqueado. Permita os pop-ups para imprimir.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imprimir Etiqueta QR-Code</title>
        <style>
          @page { margin: 10mm; size: auto; }
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
          img { max-width: 100%; max-height: 95vh; width: 420px; height: auto; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print(); window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Exportações globais
window.abrirScannerQRCode = abrirScannerQRCode;
window.fecharScannerQRCode = fecharScannerQRCode;
window.alternarCameraQR = alternarCameraQR;
window.toggleQRTorch = toggleQRTorch;
window.lerQRCodeDeArquivo = lerQRCodeDeArquivo;
window.gerarQRCodeMaquina = gerarQRCodeMaquina;
window.fecharModalPreviewQRCode = fecharModalPreviewQRCode;
window.baixarEtiquetaPNG = baixarEtiquetaPNG;
window.imprimirEtiquetaQRCode = imprimirEtiquetaQRCode;
window.fecharModalSucessoOS = fecharModalSucessoOS;
