<?php
/**
 * SOTERO LAB - Serviço de Integração VEOPAG
 * Lida com Autenticação e Geração de Cobranças PIX
 */

class VeoPagService {
    private $baseUrl = "https://api.veopag.com/api";
    private $clientId;
    private $clientSecret;

    public function __construct($clientId, $clientSecret) {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
    }

    /**
     * Autentica na API e retorna o Bearer Token
     */
    public function getAuthToken() {
        $url = $this->baseUrl . "/auth/login";
        $data = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        // Bypass SSL para compatibilidade com hospedagens (Hostinger/Infinito)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        // Aceita 200 (OK) e 201 (Created)
        if ($httpCode >= 200 && $httpCode <= 299) {
            $result = json_decode($response, true);
            return ['token' => $result['token'] ?? null];
        }

        return [
            'error' => true,
            'message' => $response ?: $curlError,
            'code' => $httpCode
        ];
    }

    /**
     * Cria um depósito PIX e retorna o QR Code
     */
    public function createPixDeposit($token, $amount, $externalId, $payerData, $callbackUrl = null) {
        $url = $this->baseUrl . "/payments/deposit";
        
        $data = [
            "amount" => (float)$amount,
            "external_id" => $externalId,
            "clientCallbackUrl" => $callbackUrl,
            "payer" => [
                "name" => $payerData['name'],
                "email" => $payerData['email'],
                "document" => $payerData['document']
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ]);
        
        // Bypass SSL
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // Aceita 200 e 201
        if ($httpCode >= 200 && $httpCode <= 299) {
            return json_decode($response, true);
        }

        return [
            'error' => true,
            'message' => 'Erro ao gerar PIX: ' . $response,
            'code' => $httpCode
        ];
    }
}
?>
