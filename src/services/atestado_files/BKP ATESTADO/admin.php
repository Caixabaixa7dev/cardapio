<?php
// --- CONFIGURAÇÃO ---
// Defina uma senha para ninguém além de você criar atestados
$senha_secreta = "caixa"; 
// ---------------------

$mensagem = "";
$novo_link = "";

if (isset($_POST['criar'])) {
    // 1. Verifica a senha
    if ($_POST['senha'] !== $senha_secreta) {
        $mensagem = "<div style='background: #ffcccc; color: #cc0000; padding: 10px; border-radius: 5px; margin-bottom: 15px;'>Senha incorreta! Tente novamente.</div>";
    } else {
        // 2. Gerar Código Aleatório de 6 caracteres (Tipo N2eGhQ)
        $caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $codigo_aleatorio = substr(str_shuffle($caracteres), 0, 6);

        // 3. Pegar dados do formulário
        $paciente = strtoupper($_POST['paciente']); // Força letra maiúscula
        $data = $_POST['data'];
        $cid = $_POST['cid'];
        $dias = $_POST['dias'];
        $medico = $_POST['medico'];

        // 4. Carregar o arquivo modelo.html
        if (file_exists('modelo.html')) {
            $template = file_get_contents('modelo.html');

            // 5. Substituir as etiquetas pelos dados reais
            $html_final = str_replace('{{CODIGO}}', $codigo_aleatorio, $template);
            $html_final = str_replace('{{PACIENTE}}', $paciente, $html_final);
            $html_final = str_replace('{{DATA}}', $data, $html_final);
            $html_final = str_replace('{{CID}}', $cid, $html_final);
            $html_final = str_replace('{{DIAS}}', $dias, $html_final);
            $html_final = str_replace('{{MEDICO}}', $medico, $html_final);

            // 6. Criar a pasta com o nome do código e salvar o index.html
            if (!file_exists($codigo_aleatorio)) {
                mkdir($codigo_aleatorio, 0755, true); // Cria pasta (ex: htdocs/XyZ123)
                file_put_contents($codigo_aleatorio . '/index.html', $html_final); // Salva o arquivo
                
                // Monta o link final para você copiar
                $protocolo = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
                $url_base = "$protocolo://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
                $url_base = dirname($url_base); // Remove o 'admin.php' do final
                $link_final = $url_base . "/" . $codigo_aleatorio;
                
                $mensagem = "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px;'>
                                <strong>✅ Atestado Criado com Sucesso!</strong>
                             </div>";
                
                $novo_link = "<div style='background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;'>
                                <p style='margin:0 0 10px 0; color:#333;'>Link exclusivo do paciente:</p>
                                <a href='$link_final' target='_blank' style='font-size: 20px; font-weight: bold; color: #4d46df; text-decoration: none;'>$link_final</a>
                                <br><br>
                                <small style='color:#666'>Copie esse link para gerar o QR Code.</small>
                              </div>";
            } else {
                $mensagem = "<div style='color:red'>Erro: O código gerado já existe. Tente clicar em Gerar novamente.</div>";
            }
        } else {
            $mensagem = "<div style='color:red'>Erro Crítico: Não encontrei o arquivo 'modelo.html' na mesma pasta.</div>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerador de Atestados | Admin</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 450px; }
        h2 { color: #4d46df; text-align: center; margin-top: 0; margin-bottom: 25px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 13px; color: #666; font-weight: bold; margin-bottom: 5px; }
        input, select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; transition: 0.2s; }
        input:focus { border-color: #4d46df; outline: none; }
        button { width: 100%; padding: 15px; background: #4d46df; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        button:hover { background: #3b36b5; }
    </style>
</head>
<body>

<div class="container">
    <h2>🏥 Fábrica de Atestados</h2>
    
    <?= $mensagem ?>

    <?php if ($novo_link): ?>
        <?= $novo_link ?>
        <button onclick="window.location.href=window.location.href" style="background:#666; margin-top: 20px;">Criar Outro</button>
    <?php else: ?>

    <form method="POST">
        <div class="form-group">
            <label>Senha de Acesso</label>
            <input type="password" name="senha" placeholder="Digite a senha secreta..." required>
        </div>

        <div class="form-group">
            <label>Nome do Paciente</label>
            <input type="text" name="paciente" placeholder="Ex: João da Silva" required>
        </div>

        <div class="form-group" style="display:flex; gap:10px;">
            <div style="flex:1">
                <label>Data</label>
                <input type="text" name="data" value="<?= date('d/m/Y') ?>" required>
            </div>
            <div style="flex:1">
                <label>Dias de Afastamento (ex: 03 (tres))</label>
                <input type="text" name="dias" value="03 (tres)" required>
            </div>
        </div>

        <div class="form-group">
            <label>CID (Código da Doença)</label>
            <input type="text" name="cid" value="M549 - Dorsalgia não especificada" required>
        </div>

        <div class="form-group">
            <label>Médico</label>
            <input type="text" name="medico" value="Dr. Guilherme Rezende" required>
        </div>

        <button type="submit" name="criar">GERAR PÁGINA ÚNICA</button>
    </form>
    <?php endif; ?>
</div>

</body>
</html>