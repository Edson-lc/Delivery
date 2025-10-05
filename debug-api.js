// Debug da configuração da API
console.log('=== DEBUG CONFIGURAÇÃO API ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Hostname:', window.location.hostname);
console.log('URL atual:', window.location.href);

// Teste direto da API
const API_URL = 'http://192.168.1.229:4000/api';

console.log('Testando API em:', API_URL);

fetch(API_URL + '/public/restaurants')
  .then(response => {
    console.log('✅ API funcionando! Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Dados recebidos:', data.length, 'restaurantes');
  })
  .catch(error => {
    console.error('❌ Erro na API:', error);
  });

console.log('=== FIM DEBUG ===');
