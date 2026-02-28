<?php
require 'config.php';
requireLogin();

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $usuario_id = $_SESSION['usuario_id'];

    // Pega as info do atestado para apagar o arquivo do disco antes de apagar do sql
    $stmt = $pdo->prepare("SELECT caminho_arquivo FROM atestados_gerados WHERE id = ? AND usuario_id = ?");
    $stmt->execute([$id, $usuario_id]);
    $arq = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($arq) {
        $file_path = __DIR__ . '/' . $arq['caminho_arquivo'];
        if (file_exists($file_path)) {
            unlink($file_path);
        }

        $stmt = $pdo->prepare("DELETE FROM atestados_gerados WHERE id = ?");
        $stmt->execute([$id]);
    }
}

header("Location: atestados_menu.php");
exit;
?>
