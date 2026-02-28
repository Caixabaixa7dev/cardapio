<?php
require 'config.php';
requireLogin();

$usuario_id = $_SESSION['usuario_id'];

// Resgata saldo para a Navbar
$stmt = $pdo->prepare("SELECT saldo FROM usuarios WHERE id = ?");
$stmt->execute([$usuario_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);
$saldo_formatado = number_format($usuario['saldo'], 2, ',', '.');

// Resgata Histórico de Atestados do usuário logado
$stmt = $pdo->prepare("SELECT * FROM atestados_gerados WHERE usuario_id = ? ORDER BY data_geracao DESC");
$stmt->execute([$usuario_id]);
$historico = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOTERO LAB | Atestados e Editáveis</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg-body: #090e17; --bg-navbar: #111827; --bg-card: #1e293b; --card-border: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --neon-blue: #0ea5e9; --neon-blue-glow: rgba(14, 165, 233, 0.5); --neon-darker: #0284c7; --success: #10b981; --danger: #ef4444; }
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
        
        body { background-color: var(--bg-body); color: var(--text-main); min-height: 100vh; padding-bottom: 50px; }
        .navbar { background-color: var(--bg-navbar); padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--neon-darker); box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15); }
        .logo-area h1 { font-size: 24px; font-weight: 800; color: #fff; text-shadow: 0 0 10px var(--neon-blue-glow); }
        .logo-area h1 span { color: var(--neon-blue); }
        .wallet-box { background-color: rgba(14, 165, 233, 0.1); border: 1px solid var(--neon-blue); padding: 8px 16px; border-radius: 8px; font-weight: 600; color: var(--neon-blue); }

        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .back-btn { color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 30px; font-weight: 500; transition: 0.2s; }
        .back-btn:hover { color: var(--neon-blue); }

        .section-title { text-align: center; font-size: 22px; color: #fff; margin-bottom: 30px; }
        
        /* GRID DE EDiTAVEIS */
        .models-grid { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 60px; }
        .model-card {
            background-color: var(--bg-card);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            padding: 30px 20px;
            width: 200px;
            text-align: center;
            text-decoration: none;
            transition: 0.3s;
            position: relative;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .model-card:hover { border-color: var(--neon-blue); transform: translateY(-5px); box-shadow: 0 10px 30px var(--neon-blue-glow); }
        .model-card h3 { font-size: 16px; color: var(--text-main); font-weight: 600; margin-top: 15px; }

        /* TABELA DE HISTORICO */
        .history-section h2 { font-size: 20px; margin-bottom: 20px; color: #fff; border-bottom: 1px solid var(--card-border); padding-bottom: 15px; }
        .table-wrapper { background-color: var(--bg-card); border-radius: 12px; border: 1px solid var(--card-border); overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: var(--bg-navbar); padding: 16px 20px; font-size: 13px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; border-bottom: 1px solid var(--card-border); }
        td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid var(--card-border); color: var(--text-main); }
        tr:last-child td { border-bottom: none; }
        
        .status-badge { background-color: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid var(--success); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        
        .action-btns { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; color: #fff; }
        .btn-download { background-color: var(--success); }
        .btn-delete { background-color: var(--danger); }
        .btn-download:hover { background-color: #059669; }
        .btn-delete:hover { background-color: #dc2626; }

        .empty-history { text-align: center; padding: 40px; color: var(--text-muted); font-size: 15px; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="logo-area"><h1>SOTERO <span>LAB</span></h1></div>
        <div class="wallet-box">Saldo Disponível: R$ <?= $saldo_formatado ?></div>
    </nav>

    <div class="container">
        <a href="dashboard.php" class="back-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar ao Dashboard
        </a>

        <h2 class="section-title">Escolha o editável que deseja gerar</h2>

        <div class="models-grid">
            <!-- Modelo Principal UPA 24h -->
            <a href="gerador_upa.php" class="model-card">
                <!-- Icone simbólico da UPA -->
                <svg width="48" height="48" fill="none" stroke="var(--neon-blue)" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <h3>Atestado UPA 24h</h3>
            </a>

            <!-- Outro modelo inativo para demonstração de painel -->
            <a href="#" class="model-card" style="opacity: 0.5; cursor: not-allowed;">
                <svg width="48" height="48" fill="none" stroke="var(--text-muted)" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                <h3>Em Breve</h3>
            </a>
        </div>

        <div class="history-section">
            <h2>Meus Editáveis Gerados</h2>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Ref #</th>
                            <th>Data de Criação</th>
                            <th>Modelo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($historico) === 0): ?>
                        <tr><td colspan="5"><div class="empty-history">Nenhum atestado foi gerado ainda.</div></td></tr>
                        <?php else: ?>
                            <?php foreach ($historico as $h): ?>
                            <tr>
                                <td><span style="color:var(--neon-blue); font-weight:600;">#<?= htmlspecialchars($h['codigo_referencia']) ?></span></td>
                                <td><?= date('d/m/Y H:i', strtotime($h['data_geracao'])) ?></td>
                                <td><?= htmlspecialchars($h['modelo']) ?></td>
                                <td><span class="status-badge">Gerado</span></td>
                                <td>
                                    <div class="action-btns">
                                        <a href="<?= htmlspecialchars($h['caminho_arquivo']) ?>" download class="btn-sm btn-download">
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            Download
                                        </a>
                                        <!-- Opcional: Acao de apagar fisicamente -->
                                        <a href="apagar_atestado.php?id=<?= $h['id'] ?>" class="btn-sm btn-delete" onclick="return confirm('Apagar este PDF de vez?');">
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            Deletar
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
