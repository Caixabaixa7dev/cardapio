<?php
require 'config.php';
requireLogin();

// Resgata o saldo real
$usuario_id = $_SESSION['usuario_id'];
$stmt = $pdo->prepare("SELECT saldo FROM usuarios WHERE id = ?");
$stmt->execute([$usuario_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);
$saldo_formatado = number_format($usuario['saldo'], 2, ',', '.');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOTERO LAB | Checkout UPA 24h</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg-body: #090e17; --bg-navbar: #111827; --bg-card: #1e293b; --card-border: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --neon-blue: #0ea5e9; --neon-blue-glow: rgba(14, 165, 233, 0.5); --neon-darker: #0284c7; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
        
        body { background-color: var(--bg-body); color: var(--text-main); min-height: 100vh; padding-bottom: 60px; }
        
        .navbar { background-color: var(--bg-navbar); padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--neon-darker); box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15); }
        .logo-area h1 { font-size: 24px; font-weight: 800; color: #fff; text-shadow: 0 0 10px var(--neon-blue-glow); }
        .logo-area h1 span { color: var(--neon-blue); }
        .wallet-box { background-color: rgba(14, 165, 233, 0.1); border: 1px solid var(--neon-blue); padding: 8px 16px; border-radius: 8px; font-weight: 600; color: var(--neon-blue); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .back-btn { color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 30px; font-weight: 500; transition: 0.2s; }
        .back-btn:hover { color: var(--neon-blue); }

        .main-layout { display: grid; grid-template-columns: 1fr 400px; gap: 40px; align-items: flex-start; }
        @media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }
        
        .form-panel { background-color: var(--bg-card); border-radius: 12px; border: 1px solid var(--card-border); padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .preview-panel { background-color: #fff; border-radius: 8px; padding: 10px; display: flex; justify-content: center; position: sticky; top: 40px; }
        .preview-img { width: 100%; max-width: 350px; border: 1px solid #e2e8f0; display: block; }
        
        /* HEADER AVISOS CHECKOUT */
        .info-bar { background-color: rgba(14, 165, 233, 0.1); border-left: 4px solid var(--neon-blue); padding: 15px 20px; border-radius: 4px; color: var(--neon-blue); font-weight: 600; font-size: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .warning-bar { background-color: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); padding: 12px; border-radius: 6px; color: var(--warning); font-weight: 500; font-size: 13px; margin-bottom: 30px; text-align: center; }

        /* FORM */
        .form-row { display: flex; align-items: center; margin-bottom: 15px; gap: 20px; }
        .form-row label { flex: 0 0 140px; font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .form-row input, .form-row select { flex: 1; padding: 12px; background-color: var(--bg-body); border: 1px solid var(--card-border); border-radius: 8px; color: #fff; font-size: 14px; outline: none; transition: 0.3s; }
        .form-row input:focus, .form-row select:focus { border-color: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue-glow); }

        .btn-submit { width: 100%; padding: 16px; background-color: var(--success); color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 16px; cursor: pointer; transition: 0.3s; margin-top: 20px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-submit:hover { background-color: #059669; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5); }
        .btn-submit:disabled { opacity: 0.7; cursor: wait; }

        /* MODAL LOADING / CHECKOUT */
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); z-index: 9999; justify-content: center; align-items: center; }
        .modal-box { background: var(--bg-card); padding: 40px; border-radius: 16px; width: 100%; max-width: 400px; text-align: center; border: 1px solid var(--neon-blue); box-shadow: 0 0 50px var(--neon-blue-glow); }
        .loader { border: 4px solid var(--bg-body); border-top: 4px solid var(--neon-blue); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .modal-title { font-size: 20px; font-weight: 700; margin-bottom: 15px; color: #fff; }
        .modal-text { font-size: 14px; color: var(--text-muted); margin-bottom: 25px; line-height: 1.5; }
        .modal-btn-download { display: none; background: var(--neon-blue); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; width: 100%; }

    </style>
</head>
<body>

    <nav class="navbar">
        <div class="logo-area"><h1>SOTERO <span>LAB</span></h1></div>
        <div class="wallet-box" id="wallet-balance">Saldo Disponível: R$ <?= $saldo_formatado ?></div>
    </nav>

    <div class="container">
        <a href="atestados_menu.php" class="back-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar a Escolha Múltipla
        </a>

        <div class="main-layout">
            
            <!-- ESQUERDA: FORMULÁRIO COMPLETO -->
            <div class="form-panel">
                <div class="info-bar">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                    Valor do serviço: R$ 20,00
                </div>

                <div class="warning-bar">
                    Aviso: A geração do PDF final está sujeita a cobrança. Verifique antes de baixar o PDF pois não haverá devolução de saldo e nem edições sobre erro de digitação ou qualquer outro motivo.
                </div>

                <form id="generador-form">
                    <div class="form-row">
                        <label>Para:</label>
                        <input type="text" name="paciente_nome" placeholder="Nome do Paciente" required>
                    </div>
                    
                    <!-- NOVO: Autocomplete de Endereço -->
                    <div class="form-row" style="position:relative;">
                        <label>Endereço Unidade</label>
                        <div style="flex:1; position:relative;">
                            <input type="text" id="busca_endereco" placeholder="Digite o endereço da Unidade..." autocomplete="off">
                            <div id="sugestoes_endereco" style="display:none; position:absolute; top:100%; left:0; right:0; background:var(--bg-card); border:1px solid var(--neon-blue); z-index:1000; border-radius:0 0 8px 8px; max-height:200px; overflow-y:auto; box-shadow: 0 10px 20px rgba(0,0,0,0.5);"></div>
                            <input type="hidden" name="endereco_completo" id="endereco_completo">
                        </div>
                    </div>

                    <div class="form-row">
                        <label>CNS</label>
                        <input type="text" name="cns" placeholder="CNS">
                    </div>
                    <div class="form-row">
                        <label>Unidade (Nome)</label>
                        <input type="text" name="unidade" placeholder="Ex: UPA Jd São Jose">
                    </div>
                    <div class="form-row">
                        <label>Data/Hora Atendimento</label>
                        <input type="text" name="data_hora" placeholder="<?= date('d/m/Y H:i') ?>">
                    </div>
                    <div class="form-row">
                        <label>Dias de Repouso</label>
                        <input type="text" name="dias_repouso" placeholder="9 (nove)">
                    </div>
                    
                    <!-- NOVO: Busca de CID-10 -->
                    <div class="form-row">
                        <label>CID-10</label>
                        <div style="flex:1;">
                            <input type="text" name="cid" list="lista-cid" placeholder="Pesquise por CID ou Doença...">
                            <datalist id="lista-cid">
                                <option value="J02.0 - Faringite estreptocócica">
                                <option value="M54.9 - Dorsalgia">
                                <option value="B34.9 - Infecção viral não especificada">
                                <option value="R50.9 - Febre não especificada">
                                <option value="K29.7 - Gastrite não especificada">
                                <option value="Outro">
                            </datalist>
                        </div>
                    </div>

                    <div class="form-row">
                        <label>Local/Data</label>
                        <input type="text" name="local_data" placeholder="Campinas, <?= date('d') ?> de fevereiro">
                    </div>
                    
                    <button type="submit" class="btn-submit" id="submit-btn" <?= ($usuario['saldo'] < 20) ? 'disabled style="background:gray;"' : '' ?>>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <?= ($usuario['saldo'] < 20) ? 'SALDO INSUFICIENTE' : 'GERAR ATESTADO (R$ 20,00)' ?>
                    </button>
                </form>
            </div>

            <!-- DIREITA: PREVIEW -->
            <div class="preview-panel">
                <!-- Simulação de layout de folha branca pois é dark mode fora -->
                <div style="width:100%; aspect-ratio:1/1.41; border:1px solid #ddd; background: #fff; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <h3 style="color:#000; font-family:Arial; font-size:16px;">Exemplo de Atestado</h3>
                    <p style="color:#999; font-size:12px; margin-top:20px; font-family:Arial; text-align:center;">Preview da Estrutura UPA 24H (Mockup)</p>
                    <svg style="margin-top:40px; color:#aaa;" width="50" height="50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL DO CHECKOUT E GERAÇÃO -->
    <div class="modal-overlay" id="checkout-modal">
        <div class="modal-box">
            <div class="loader" id="loader-spinner"></div>
            <h2 class="modal-title" id="modal-title">Processando Pagamento...</h2>
            <p class="modal-text" id="modal-text">Estamos descontando R$ 20,00 do seu saldo e gerando o seu modelo de atestado em alta resolução. Não feche a página.</p>
            
            <a href="#" class="modal-btn-download" id="download-trigger" download>BAIXAR SEU ATESTADO</a>
            
            <div style="margin-top: 20px; text-align: center;">
                <a href="atestados_menu.php" style="color:var(--text-muted); font-size: 13px; text-decoration:underline; display:none;" id="modal-close-trigger">Voltar para histórico</a>
            </div>
        </div>
    </div>

    <script>
        // Lógica de Autocomplete de Endereço (Photon API)
        const inputEnd = document.getElementById('busca_endereco');
        const sugestoes = document.getElementById('sugestoes_endereco');
        const hiddenEnd = document.getElementById('endereco_completo');

        inputEnd.addEventListener('input', async function() {
            const query = this.value;
            if (query.length < 3) {
                sugestoes.style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=pt`);
                const data = await response.json();
                
                sugestoes.innerHTML = '';
                if (data.features.length > 0) {
                    data.features.forEach(feat => {
                        const p = feat.properties;
                        const label = `${p.name || ''}, ${p.street || ''} ${p.housenumber || ''} - ${p.district || p.city || ''}, ${p.state || ''} - CEP: ${p.postcode || ''}`.replace(/,,/g, ',').replace(/^, /, '');
                        
                        const item = document.createElement('div');
                        item.style.padding = '10px';
                        item.style.cursor = 'pointer';
                        item.style.borderBottom = '1px solid var(--card-border)';
                        item.innerText = label;
                        
                        item.onclick = function() {
                            inputEnd.value = label;
                            hiddenEnd.value = label;
                            sugestoes.style.display = 'none';
                        };
                        
                        sugestoes.appendChild(item);
                    });
                    sugestoes.style.display = 'block';
                } else {
                    sugestoes.style.display = 'none';
                }
            } catch (e) {
                console.error("Erro no autocomplete", e);
            }
        });

        // Fecha sugestões ao clicar fora
        document.addEventListener('click', function(e) {
            if (e.target !== inputEnd) sugestoes.style.display = 'none';
        });

        document.getElementById('generador-form').addEventListener('submit', async function(e){
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const modal = document.getElementById('checkout-modal');
            const title = document.getElementById('modal-title');
            const text = document.getElementById('modal-text');
            const spinner = document.getElementById('loader-spinner');
            const dBtn = document.getElementById('download-trigger');
            const cBtn = document.getElementById('modal-close-trigger');
            
            // Ativa o Loading e Modal
            btn.disabled = true;
            modal.style.display = 'flex';
            
            const formData = new FormData(this);
            
            try {
                // Aguarda 1 segundo fake pra aparecer pro cliente processando
                await new Promise(r => setTimeout(r, 1200));

                const response = await fetch('gerar_pdf.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    // Atualizou
                    spinner.style.display = 'none';
                    title.style.color = 'var(--neon-blue)';
                    title.innerText = 'Gerado com Sucesso!';
                    text.innerText = 'Seu saldo foi reduzido em R$ 20,00. O arquivo PDF final já está liberado.';
                    
                    document.getElementById('wallet-balance').innerText = 'Saldo Disponível: R$ ' + data.novo_saldo;
                    
                    dBtn.style.display = 'inline-block';
                    dBtn.href = data.url;
                    cBtn.style.display = 'inline-block';
                } else {
                    spinner.style.display = 'none';
                    title.style.color = 'var(--danger)';
                    title.innerText = 'Falha no Lançamento';
                    text.innerText = data.mensagem;
                    cBtn.style.display = 'inline-block';
                }
            } catch (error) {
                spinner.style.display = 'none';
                title.style.color = 'var(--danger)';
                title.innerText = 'Erro Crítico';
                text.innerText = 'Falha no servidor. Verifique a internet.';
                cBtn.style.display = 'inline-block';
            }
        });
    </script>
</body>
</html>
