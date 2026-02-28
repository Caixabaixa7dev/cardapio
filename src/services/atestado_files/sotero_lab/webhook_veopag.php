<?php
require_once 'config.php';

// Recebe o dump do JSON enviado pela VEOPAG
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

if (!$data) {
    http_response_code(400);
    exit('Payload inválido');
}

$status = $data['status'] ?? '';
$external_id = $data['external_id'] ?? '';
$amount = floatval($data['amount'] ?? 0);

if ($status === 'COMPLETED') {
    // 1. Localiza a recarga pendente
    $stmt = $pdo->prepare("SELECT * FROM recargas WHERE external_id = ? AND status = 'PENDING'");
    $stmt->execute([$external_id]);
    $recarga = $stmt->fetch();

    if ($recarga) {
        // 2. Atualiza status da recarga
        $stmt = $pdo->prepare("UPDATE recargas SET status = 'COMPLETED' WHERE id = ?");
        $stmt->execute([$recarga['id']]);

        // 3. Adiciona saldo ao usuário (Valor pago + 5% bônus)
        $valor_total = $recarga['valor_pago'] + $recarga['valor_bonus'];
        $stmt = $pdo->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?");
        $stmt->execute([$valor_total, $recarga['usuario_id']]);

        echo "Saldo atualizado com sucesso.";
    } else {
        echo "Recarga não encontrada ou já processada.";
    }
} else {
    echo "Status: " . $status;
}

http_response_code(200);
?>
