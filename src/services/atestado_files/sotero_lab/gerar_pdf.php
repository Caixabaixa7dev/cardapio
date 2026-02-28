<?php
require 'config.php';
requireLogin();
require_once __DIR__ . '/lib/autoload.php';

use setasign\Fpdi\Fpdi;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario_id = $_SESSION['usuario_id'];
    $custo = 20.00;

    // 1. Validar Saldo
    $stmt = $pdo->prepare("SELECT saldo FROM usuarios WHERE id = ?");
    $stmt->execute([$usuario_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario['saldo'] < $custo) {
        echo json_encode(['status' => 'error', 'mensagem' => 'Saldo insuficiente! Faça uma recarga.']);
        exit;
    }

    // Pega dados do Form (Exemplo de Injeção no PDF)
    // O ideal é mapear X e Y pra cada campo conforme a foto Anexo 3. 
    $paciente_nome = strtoupper($_POST['paciente_nome'] ?? '');
    $dias_repouso = $_POST['dias_repouso'] ?? '';
    // Pegaremos os outros campos no futuro mas simplificaremos para o protótipo:
    $cid = $_POST['cid'] ?? '';
    $data_hora = $_POST['data_hora'] ?? date('d/m/Y H:i:s');

    // MÁGICA: Gera o Código Ref e debita o saldo dentro de uma Transaction Segura
    $pdo->beginTransaction();
    try {
        $novo_saldo = $usuario['saldo'] - $custo;
        $stmt = $pdo->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?");
        $stmt->execute([$novo_saldo, $usuario_id]);

        $ref_code = 'UPA' . strtoupper(substr(md5(uniqid()), 0, 6));

        // 3. Modifica o PDF
        $pdf = new Fpdi();
        $pdf->AddPage();
        // Hostinger Web Path Absolute Fallback - Tentando vários caminhos
        $possiveis_caminhos = [
            __DIR__ . '/modelo.pdf',
            dirname($_SERVER['SCRIPT_FILENAME']) . '/modelo.pdf',
            $_SERVER['DOCUMENT_ROOT'] . '/modelo.pdf'
        ];
        
        $caminho_modelo = '';
        foreach ($possiveis_caminhos as $path) {
            if (file_exists($path)) {
                $caminho_modelo = $path;
                break;
            }
        }

        // Importa a Página 1 do seu modelo real se encontrou o arquivo.
        if ($caminho_modelo && file_exists($caminho_modelo)) {
            $pdf->setSourceFile($caminho_modelo);
            $tplIdx = $pdf->importPage(1);
            $pdf->useTemplate($tplIdx, 0, 0, 210); // A4
        } else {
            // DIAGNÓSTICO DE ERRO PARA O USUÁRIO (Aparecerá no PDF se falhar)
            $pdf->SetFont('Arial','B',10);
            $msg = "Buscando 'modelo.pdf' nos seguintes locais:\n";
            foreach($possiveis_caminhos as $p) { $msg .= "- " . $p . "\n"; }
            $msg .= "\nERRO: Nenhum arquivo encontrado. Verifique o nome/local no servidor.";
            $pdf->MultiCell(0, 5, mb_convert_encoding($msg, 'ISO-8859-1', 'UTF-8'), 0, 'C');
        }

        // Pega as novas variáveis do POST
        $cns = $_POST['cns'] ?? '';
        $unidade = $_POST['unidade'] ?? '';
        $cid = $_POST['cid'] ?? '';
        $local_data = $_POST['local_data'] ?? ''; // ex: UPA 24h Valinhos, 08 de Fevereiro de 2026.

        // Mapeamento e Inserção Visual no PDF (Tamanho A4: 210 x 297 mm)
        // A fonte e tamanho padrão (Arial 11 Preto)
        $pdf->SetTextColor(0, 0, 0); 

        // 1. Cabecalho de Endereço Dinâmico (Vindo do Autocomplete)
        $endereco_unidade = $_POST['endereco_completo'] ?? "Av. Gessy Lever, 550 -\nLenheiro, Valinhos - SP,\n13270-005";
        
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetXY(110, 25);
        $pdf->MultiCell(60, 4, mb_convert_encoding($endereco_unidade, 'ISO-8859-1', 'UTF-8'), 0, 'L');

        // 2. CAMPO "PARA" (Formato: PARA : NOME DO PACIENTE)
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->SetXY(15, 78);
        $pdf->Write(0, mb_convert_encoding("PARA : " . $paciente_nome, 'ISO-8859-1', 'UTF-8'));

        // 3. CONJUNTO COMPLETO: Parágrafo Principal
        $pdf->SetFont('Arial', '', 11);
        $pdf->SetXY(15, 100); 
        
        $texto_completo = "Atesto para os devidos fins, que o(a) " . $paciente_nome . " ,CNS:" . $cns . " foi atendido(a) no(a), " . $unidade . " na data " . $data_hora . ", necessitando de " . $dias_repouso . " dias de repouso por motivo de doença.";
        
        $pdf->MultiCell(180, 7, mb_convert_encoding($texto_completo, 'ISO-8859-1', 'UTF-8'), 0, 'L');

        // 4. CID (Conjunto Completo - Dinâmico)
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->SetXY(15, 130);
        $pdf->Write(0, mb_convert_encoding("CID: " . $cid, 'ISO-8859-1', 'UTF-8'));

        // 5. Local e Data por extenso (Ajustado para evitar quebra de linha)
        $pdf->SetFont('Arial', '', 11);
        $pdf->SetXY(115, 125); 
        $pdf->Write(0, mb_convert_encoding($local_data, 'ISO-8859-1', 'UTF-8'));

        // 6. Rodapé Esq (Emitido em: - Acima do logo UPA conforme anexo)
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetXY(15, 222);
        $pdf->Write(0, mb_convert_encoding("Emitido em: " . $data_hora, 'ISO-8859-1', 'UTF-8'));

        // 7. Rodapé Dir (Assinado eletronicamente em: - Exatamente acima do carimbo)
        $pdf->SetXY(125, 220);
        $pdf->MultiCell(70, 4, mb_convert_encoding("Liberado e assinado\neletronicamente em " . $data_hora, 'ISO-8859-1', 'UTF-8'), 0, 'R');

        // (Opcional) Identificador SOTERO LAB Rodapé Final
        $pdf->SetFont('Arial', '', 6);
        $pdf->SetTextColor(180, 180, 180);
        $pdf->SetXY(10, 288);
        $pdf->Write(0, "SOTERO LAB - REF: " . $ref_code);

        // 4. Salvar PDF local
        $nome_arquivo = 'gerados/' . $ref_code . '.pdf';
        if (!file_exists('gerados')) mkdir('gerados');
        $pdf->Output('F', __DIR__ . '/' . $nome_arquivo);

        // 5. Salva na db
        $stmt = $pdo->prepare("INSERT INTO atestados_gerados (codigo_referencia, usuario_id, modelo, valor_cobrado, caminho_arquivo) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$ref_code, $usuario_id, 'Atestado UPA 24h', $custo, $nome_arquivo]);

        $pdo->commit();

        echo json_encode(['status' => 'success', 'url' => $nome_arquivo, 'ref' => $ref_code, 'novo_saldo' => number_format($novo_saldo, 2, ',', '.')]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'mensagem' => 'Falha interna ao gerar documento: ' . $e->getMessage()]);
    }
}
?>
