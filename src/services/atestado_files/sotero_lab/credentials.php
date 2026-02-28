<?php
/**
 * ARQUIVO DE CREDENCIAIS - SOTERO LAB
 * IMPORTANTE: Chaves configuradas para produção.
 */

// VEOPAG API KEYS (REAIS)
define('VEO_RAW_ID', 'samanthalotufolentedomingos_L0FYMTWZ'); 
define('VEO_RAW_SECRET', '5vpC1GUD331STKL1vbAzNIKeZ7yuO9WCYtk5gQ7knmb5RHDlj2qRfVuaxJxgi61OY6duGibXaxPXtDBeJ3NEw0S9UiEwbkKRqVgN');

function get_veo_client_id() {
    return trim(VEO_RAW_ID);
}

function get_veo_client_secret() {
    return trim(VEO_RAW_SECRET);
}
?>
