<?php
require 'config.php';
requireLogin();

$usuario_id = $_SESSION['usuario_id'];

// Resgata saldo atual
$stmt = $pdo->prepare("SELECT saldo, email, nome FROM usuarios WHERE id = ?");
$stmt->execute([$usuario_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);
$saldo_formatado = number_format($usuario['saldo'], 2, ',', '.');

// Armazena e-mail na sessão se não estiver para o processador usar
$_SESSION['usuario_email'] = $usuario['email'] ?? "";
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOTERO LAB | Recargas PIX</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg-body: #090e17; --bg-navbar: #111827; --bg-card: #1e293b; --card-border: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --neon-blue: #0ea5e9; --neon-blue-glow: rgba(14, 165, 233, 0.5); --neon-darker: #0284c7; --success: #10b981; --danger: #ef4444; }
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
        body { background-color: var(--bg-body); color: var(--text-main); min-height: 100vh; }
        .navbar { background-color: var(--bg-navbar); padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--neon-darker); }
        .logo-area h1 { font-size: 24px; font-weight: 800; color: #fff; }
        .logo-area h1 span { color: var(--neon-blue); }
        .wallet-box { background-color: rgba(14, 165, 233, 0.1); border: 1px solid var(--neon-blue); padding: 8px 16px; border-radius: 8px; font-weight: 600; color: var(--neon-blue); }
        .back-btn { color: var(--text-muted); text-decoration: none; display: flex; align-items: center; gap: 8px; margin-bottom: 30px; font-weight: 500; transition: 0.2s; }
        .back-btn:hover { color: var(--neon-blue); }
        .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .recharge-card { background-color: var(--bg-card); border: 1px solid var(--card-border); border-radius: 16px; padding: 40px 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; }
        .recharge-card h2 { font-size: 24px; margin-bottom: 10px; color: #fff; }
        .recharge-card p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 30px; }
        .form-group { text-align: left; margin-bottom: 25px; }
        .form-group label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; }
        .money-input-wrapper { display: flex; align-items: center; background: var(--bg-body); border: 1px solid var(--card-border); border-radius: 12px; padding: 0 20px; transition: 0.3s; }
        .money-input-wrapper:focus-within { border-color: var(--neon-blue); box-shadow: 0 0 15px var(--neon-blue-glow); }
        .currency { font-size: 24px; font-weight: 700; color: var(--text-muted); }
        .money-input { background: transparent; border: none; color: #fff; font-size: 32px; font-weight: 700; padding: 15px 10px; width: 100%; outline: none; }
        .cashback-badge { display: inline-block; background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid var(--success); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 25px; }
        .btn-submit { width: 100%; padding: 16px; background-color: var(--neon-blue); color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; text-transform: uppercase; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px var(--neon-blue-glow); }
        .btn-submit:hover { transform: translateY(-3px); box-shadow: 0 8px 25px var(--neon-blue-glow); }
        .btn-submit:disabled { background: #475569; cursor: not-allowed; box-shadow: none; }

        /* Modal PIX */
        .modal-pix { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--neon-blue); width: 100%; max-width: 450px; border-radius: 20px; padding: 30px; text-align: center; position: relative; animation: modalIn 0.3s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .qr-placeholder { background: #fff; width: 220px; height: 220px; margin: 20px auto; border-radius: 12px; padding: 10px; }
        .qr-placeholder img { width: 100%; height: 100%; }
        .pix-copy-box { background: var(--bg-body); padding: 12px; border: 1px dashed var(--neon-blue); border-radius: 8px; margin-top: 15px; font-size: 12px; color: var(--text-muted); word-break: break-all; cursor: pointer; }
        .pix-copy-box:active { background: rgba(14, 165, 233, 0.1); }
        .close-modal { position: absolute; top: 15px; right: 15px; color: var(--text-muted); cursor: pointer; font-size: 20px; }
        
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="logo-area"><h1>SOTERO <span>LAB</span></h1></div>
        <div class="wallet-box" id="wallet-display">Saldo: R$ <?= $saldo_formatado ?></div>
    </nav>

    <div class="container">
        <a href="dashboard.php" class="back-btn">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar ao Dashboard
        </a>

        <div class="recharge-card">
            <h2>Recarga via PIX</h2>
            <p class="subtitle">Crédito imediato com 5% de cashback</p>

            <div class="cashback-badge">🎉 GANHE 5% DE BÔNUS NA HORA!</div>

            <form id="payForm">
                <div class="form-group">
                    <label>Valor da Recarga (Mínimo R$ 20)</label>
                    <div class="money-input-wrapper">
                        <span class="currency">R$</span>
                        <input type="number" step="0.01" min="20" id="valor" class="money-input" placeholder="0.00" required>
                    </div>
                </div>
                <button type="submit" id="btnPay" class="btn-submit">Gerar QR Code PIX</button>
            </form>
        </div>
    </div>

    <!-- Modal do PIX -->
    <div id="modalPix" class="modal-pix">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <h3 style="color:var(--neon-blue)">Pague com PIX</h3>
            <p style="font-size:14px; color:var(--text-muted); margin-top:5px;">Escaneie o código abaixo para finalizar</p>
            
            <div class="qr-placeholder" id="qrContainer">
                <!-- QR Code via Base64 -->
            </div>

            <p style="font-size:12px; margin-bottom:5px;">Pix Copia e Cola:</p>
            <div class="pix-copy-box" id="pixCode" onclick="copyPix()">Clique para copiar o código</div>
            
            <div style="margin-top:20px; font-size:13px; color:var(--success)">
                <div class="loading" style="border-top-color:var(--success); width:15px; height:15px;"></div>
                Aguardando confirmação do pagamento...
            </div>
        </div>
    </div>

    <script>
        const payForm = document.getElementById('payForm');
        const btnPay = document.getElementById('btnPay');
        const modalPix = document.getElementById('modalPix');
        const qrContainer = document.getElementById('qrContainer');
        const pixCode = document.getElementById('pixCode');

        payForm.onsubmit = async (e) => {
            e.preventDefault();
            const valor = document.getElementById('valor').value;
            
            btnPay.disabled = true;
            btnPay.innerHTML = '<div class="loading"></div> Processando...';

            try {
                const formData = new FormData();
                formData.append('valor', valor);

                const response = await fetch('processar_pix.php', {
                    method: 'POST',
                    body: formData
                });
                
                const responseText = await response.text();
                console.log("Resposta do Servidor:", responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error("Falha ao processar JSON:", responseText);
                    alert("Erro no servidor (não JSON). Verifique log do PHP ou Console.");
                    btnPay.disabled = false;
                    btnPay.innerHTML = 'Gerar QR Code PIX';
                    return;
                }

                if(data.success) {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.qrcode_text)}`;
                    qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code PIX">`;
                    pixCode.innerText = data.qrcode_text;
                    modalPix.style.display = 'flex';
                    startChecking(data.transaction_id);
                } else {
                    alert(data.error || 'Erro ao gerar PIX');
                }
            } catch (err) {
                console.error("Erro Crítico de Rede:", err);
                alert('Erro de conexão: ' + err.message);
            } finally {
                btnPay.disabled = false;
                btnPay.innerHTML = 'Gerar QR Code PIX';
            }
        };

        function closeModal() {
            modalPix.style.display = 'none';
            location.reload(); 
        }

        function copyPix() {
            const text = pixCode.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = pixCode.innerText;
                pixCode.innerText = 'Copiado com sucesso! ✅';
                pixCode.style.color = 'var(--success)';
                setTimeout(() => {
                    pixCode.innerText = text;
                    pixCode.style.color = 'var(--text-muted)';
                }, 2000);
            });
        }

        // Simulação de check de status simplificado
        function startChecking(tid) {
            setInterval(async () => {
                // Aqui você poderia ter um script check_status.php
                // Por enquanto o Webhook cuidará do saldo.
            }, 5000);
        }
    </script>
</body>
</html>
