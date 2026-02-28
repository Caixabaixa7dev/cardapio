<?php
require 'config.php';
requireLogin();

$usuario_id = $_SESSION['usuario_id'];
$stmt = $pdo->prepare("SELECT nome, saldo FROM usuarios WHERE id = ?");
$stmt->execute([$usuario_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

// Nome e saldo atualizados
$nome_array = explode(" ", $usuario['nome']);
$primeiro_nome = $nome_array[0];
$saldo_formatado = number_format($usuario['saldo'], 2, ',', '.');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOTERO LAB | Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-body: #090e17; /* Fundo hiper-escuro */
            --bg-navbar: #111827; /* Fundo topo */
            --bg-card: #1e293b; /* Fundo dos cards base */
            --card-border: #334155;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --neon-blue: #0ea5e9;
            --neon-blue-glow: rgba(14, 165, 233, 0.5);
            --neon-darker: #0284c7;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
        
        body { background-color: var(--bg-body); color: var(--text-main); min-height: 100vh; }

        /* NAVBAR (TOPO) */
        .navbar {
            background-color: var(--bg-navbar);
            padding: 15px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--neon-darker);
            box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
        }

        .logo-area h1 { font-size: 24px; font-weight: 800; color: #fff; text-shadow: 0 0 10px var(--neon-blue-glow); }
        .logo-area h1 span { color: var(--neon-blue); }

        .user-balance {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .wallet-box {
            background-color: rgba(14, 165, 233, 0.1);
            border: 1px solid var(--neon-blue);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--neon-blue);
            box-shadow: 0 0 10px rgba(14, 165, 233, 0.2) inset;
        }

        .logout-btn {
            background: transparent;
            color: var(--danger);
            border: 1px solid var(--danger);
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: 0.3s;
        }
        .logout-btn:hover { background: var(--danger); color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.4); }

        /* MAIN CONTAINER */
        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }

        .welcome-msg { margin-bottom: 30px; font-size: 16px; color: var(--text-muted); }
        .welcome-msg strong { color: var(--text-main); }

        /* BOX DE AVISOS */
        .panel {
            background-color: var(--bg-card);
            border-radius: 12px;
            border: 1px solid var(--card-border);
            overflow: hidden;
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }

        .panel-header {
            background-color: var(--neon-darker);
            padding: 15px 20px;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .panel-body { padding: 20px; }
        
        .alert-item {
            background-color: rgba(255,255,255,0.03);
            border: 1px solid var(--card-border);
            padding: 15px;
            border-radius: 8px;
        }
        .alert-item .date { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; display: inline-flex; align-items: center; gap: 8px; }
        .tag-novo { background-color: var(--danger); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .alert-item p { font-size: 14px; line-height: 1.6; color: var(--text-main); }

        /* GRID DE SERVIÇOS */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .service-card {
            background-color: var(--bg-navbar);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            padding: 25px 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        /* BRILHO NEON NO HOVER */
        .service-card:hover {
            border-color: var(--neon-blue);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px var(--neon-blue-glow);
        }

        /* EFEITO DE LUZ INTERNA */
        .service-card::before {
            content: ''; position: absolute; top: -50px; right: -50px; width: 100px; height: 100px;
            background: var(--neon-blue); filter: blur(60px); opacity: 0; transition: 0.3s;
        }
        .service-card:hover::before { opacity: 0.3; }

        .service-icon {
            width: 60px;
            height: 60px;
            background-color: rgba(14, 165, 233, 0.1);
            border: 1px solid var(--neon-blue);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--neon-blue);
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.2) inset;
        }

        .service-info h3 { font-size: 18px; color: var(--text-main); margin-bottom: 6px; }
        .service-info p { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
        .status-online { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--success); font-weight: 600; text-transform: uppercase; }
        .status-online::before { content: ''; width: 8px; height: 8px; background-color: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); }

    </style>
</head>
<body>

    <nav class="navbar">
        <div class="logo-area">
            <h1>SOTERO <span>LAB</span></h1>
        </div>
        <div class="user-balance">
            <div class="wallet-box">Saldo Disponível: R$ <?= $saldo_formatado ?></div>
            <a href="logout.php" class="logout-btn">Sair</a>
        </div>
    </nav>

    <div class="container">
        
        <p class="welcome-msg">Olá, <strong><?= htmlspecialchars($primeiro_nome) ?></strong>! Bem-vindo ao painel master do <strong>SOTERO LAB</strong>.</p>

        <!-- AVISOS -->
        <div class="panel">
            <div class="panel-header">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                Central de Avisos
            </div>
            <div class="panel-body">
                <div class="alert-item">
                    <div class="date">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        HOJE - Atualização
                        <span class="tag-novo">NOVO!</span>
                    </div>
                    <p><strong>Mudanças implementadas:</strong><br>
                    1. Sistema de Atestados Inteligentes via PDF liberado!<br>
                    2. Cashbacks de <strong>5%</strong> ativados para todas as recargas a partir de R$ 20,00.</p>
                </div>
            </div>
        </div>

        <!-- SERVIÇOS -->
        <div class="panel">
            <div class="panel-header">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Serviços Disponíveis
            </div>
            <div class="panel-body services-grid">
                
                <!-- CARD RECARGA -->
                <a href="recargas.php" class="service-card">
                    <div class="service-icon">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div class="service-info">
                        <h3>Recargas de Saldo</h3>
                        <p>Gerencie seus créditos com 5% Cashback</p>
                        <div class="status-online">Online</div>
                    </div>
                </a>

                <!-- CARD ATESTADOS -->
                <a href="atestados_menu.php" class="service-card">
                    <div class="service-icon">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="service-info">
                        <h3>Modelos de Atestados</h3>
                        <p>Acesse o gerador automático em PDF</p>
                        <div class="status-online">Online</div>
                    </div>
                </a>

            </div>
        </div>

    </div>

</body>
</html>
