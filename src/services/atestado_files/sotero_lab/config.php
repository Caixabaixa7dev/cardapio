<?php
session_start();
require_once 'credentials.php';

$dbFile = __DIR__ . '/sotero.sqlite';
$dsn = 'sqlite:' . $dbFile;

try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Tabelas Iniciais
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        cpf TEXT,
        senha TEXT NOT NULL,
        saldo DECIMAL(10,2) DEFAULT 0.00
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS recargas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        valor_pago DECIMAL(10,2),
        valor_bonus DECIMAL(10,2),
        status TEXT DEFAULT 'PENDING',
        external_id TEXT,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    )");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS atestados_gerados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_referencia TEXT,
            usuario_id INTEGER,
            modelo TEXT,
            valor_cobrado REAL,
            data_geracao DATETIME DEFAULT CURRENT_TIMESTAMP,
            caminho_arquivo TEXT,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    ");

    // Garantir colunas novas na tabela recargas (Casos de atualização)
    try { $pdo->exec("ALTER TABLE recargas ADD COLUMN status TEXT DEFAULT 'PENDING'"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE recargas ADD COLUMN external_id TEXT"); } catch (Exception $e) {}
    
} catch (PDOException $e) {
    die("Erro CRÍTICO no Banco de Dados: " . $e->getMessage());
}

// Helper de autenticação
function requireLogin() {
    if (!isset($_SESSION['usuario_id'])) {
        header("Location: index.php");
        exit;
    }
}
?>
