<?php
require 'config.php';

// Redireciona se logado
if (isset($_SESSION['usuario_id'])) {
    header("Location: dashboard.php");
    exit;
}

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    
    if ($acao === 'login') {
        $email = trim($_POST['email']);
        $senha = $_POST['senha'];
        
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($senha, $user['senha'])) {
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario_nome'] = $user['nome'];
            header("Location: dashboard.php");
            exit;
        } else {
            $erro = "E-mail ou senha incorretos!";
        }
    } elseif ($acao === 'registro') {
        $nome = trim($_POST['nome']);
        $email = trim($_POST['email']);
        $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $erro = "E-mail já está em uso!";
        } else {
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
            $stmt->execute([$nome, $email, $senha]);
            
            $_SESSION['usuario_id'] = $pdo->lastInsertId();
            $_SESSION['usuario_nome'] = $nome;
            header("Location: dashboard.php");
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOTERO LAB | Login de Revendedor</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --neon-blue: #0ea5e9;
            --neon-blue-glow: rgba(14, 165, 233, 0.4);
            --border-color: #334155;
            --danger: #ef4444;
        }
        
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
        
        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .auth-container {
            width: 100%;
            max-width: 400px;
            background-color: var(--bg-card);
            border-radius: 16px;
            padding: 40px 30px;
            box-shadow: 0 0 40px var(--neon-blue-glow);
            border: 1px solid var(--border-color);
        }

        .logo-area {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo-area h1 {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            letter-spacing: 1px;
            text-shadow: 0 0 10px var(--neon-blue-glow);
        }
        .logo-area h1 span { color: var(--neon-blue); }

        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 14px;
            background-color: var(--bg-dark);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-main);
            font-size: 15px;
            transition: all 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: var(--neon-blue);
            box-shadow: 0 0 10px var(--neon-blue-glow);
        }

        .btn {
            width: 100%;
            padding: 14px;
            background-color: var(--neon-blue);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px var(--neon-blue-glow);
            margin-top: 10px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--neon-blue-glow);
        }

        .toggle-form {
            text-align: center;
            margin-top: 24px;
            font-size: 14px;
            color: var(--text-muted);
        }
        .toggle-form a {
            color: var(--neon-blue);
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
        }
        .toggle-form a:hover { text-decoration: underline; }

        .error-msg {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
            text-align: center;
        }

        #form-registro { display: none; }
    </style>
</head>
<body>

    <div class="auth-container">
        <div class="logo-area">
            <h1>SOTERO <span>LAB</span></h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 5px;">Acesso Restrito para Revendedores</p>
        </div>

        <?php if ($erro): ?>
            <div class="error-msg"><?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>

        <!-- FORM LOGIN -->
        <form id="form-login" method="POST">
            <input type="hidden" name="acao" value="login">
            <div class="form-group">
                <label>E-MAIL</label>
                <input type="email" name="email" placeholder="revendedor@email.com" required>
            </div>
            <div class="form-group">
                <label>SENHA</label>
                <input type="password" name="senha" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn">ENTRAR NO SISTEMA</button>
            <div class="toggle-form">
                Não possui conta? <a onclick="toggleForms()">Solicitar Acesso</a>
            </div>
        </form>

        <!-- FORM REGISTRO -->
        <form id="form-registro" method="POST">
            <input type="hidden" name="acao" value="registro">
            <div class="form-group">
                <label>NOME COMPLETO</label>
                <input type="text" name="nome" placeholder="Seu nome">
            </div>
            <div class="form-group">
                <label>E-MAIL DE REVENDEDOR</label>
                <input type="email" name="email" placeholder="revendedor@email.com">
            </div>
            <div class="form-group">
                <label>SENHA SEGURA</label>
                <input type="password" name="senha" placeholder="••••••••">
            </div>
            <button type="submit" class="btn">CRIAR CONTA BASE</button>
            <div class="toggle-form">
                Já tem acesso? <a onclick="toggleForms()">Voltar ao Login</a>
            </div>
        </form>
    </div>

    <script>
        function toggleForms() {
            const login = document.getElementById('form-login');
            const registro = document.getElementById('form-registro');
            if (login.style.display === 'none') {
                login.style.display = 'block';
                registro.style.display = 'none';
                registro.querySelectorAll('input').forEach(i => i.removeAttribute('required'));
                login.querySelectorAll('input:not([type="hidden"])').forEach(i => i.setAttribute('required', 'true'));
            } else {
                login.style.display = 'none';
                registro.style.display = 'block';
                login.querySelectorAll('input').forEach(i => i.removeAttribute('required'));
                registro.querySelectorAll('input:not([type="hidden"])').forEach(i => i.setAttribute('required', 'true'));
            }
        }
    </script>
</body>
</html>
