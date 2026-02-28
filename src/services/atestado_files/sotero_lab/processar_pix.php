<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';
require_once 'veopag_service.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $valor = floatval($_POST['valor'] ?? 0);
    $user_id = $_SESSION['usuario_id'];
    $user_name = $_SESSION['usuario_nome'] ?? 'Usuário SOTERO';
    $user_email = $_SESSION['usuario_email'] ?? 'vendas@soterolab.com'; 

    if ($valor < 20) {
        echo json_encode(['error' => 'Valor mínimo R$ 20,00']);
        exit;
    }

    // Usando credenciais reais do arquivo credentials.php
    $veoService = new VeoPagService(get_veo_client_id(), get_veo_client_secret());
    $authResponse = $veoService->getAuthToken();

    if (isset($authResponse['error'])) {
        $msg_erro = $authResponse['message'] ?? 'Erro desconhecido na gateway.';
        echo json_encode(['error' => 'Falha na autenticação: ' . $msg_erro]);
        exit;
    }

    $token = $authResponse['token'];

    $external_id = "REC_" . $user_id . "_" . time();
    $payer = [
        "name" => $user_name,
        "email" => $user_email,
        "document" => "00000000000" 
    ];

    // Constrói a URL do Webhook dinamicamente baseado no servidor atual
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $callbackUrl = $protocol . "://" . $host . dirname($_SERVER['REQUEST_URI']) . "/webhook_veopag.php";

    $pixResponse = $veoService->createPixDeposit($token, $valor, $external_id, $payer, $callbackUrl);

    if (isset($pixResponse['qrCodeResponse'])) {
        // Salva a intenção de recarga no banco para conferência posterior
        $stmt = $pdo->prepare("INSERT INTO recargas (usuario_id, valor_pago, valor_bonus, status, external_id) VALUES (?, ?, ?, 'PENDING', ?)");
        $bonus = $valor * 0.05;
        $stmt->execute([$user_id, $valor, $bonus, $external_id]);

        echo json_encode([
            'success' => true,
            'qrcode' => $pixResponse['qrCodeResponse']['qrcode_base64'] ?? $pixResponse['qrCodeResponse']['qrcode'],
            'qrcode_text' => $pixResponse['qrCodeResponse']['qrcode'],
            'transaction_id' => $pixResponse['qrCodeResponse']['transactionId']
        ]);
    } else {
        echo json_encode(['error' => 'Erro ao gerar cobrança PIX: ' . ($pixResponse['message'] ?? 'Erro desconhecido')]);
    }
    exit;
}
?>
