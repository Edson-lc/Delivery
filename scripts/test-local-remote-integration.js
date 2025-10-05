#!/usr/bin/env node

/**
 * Script para testar integração Frontend Local + Backend Remoto
 * Testa se o frontend local consegue se comunicar com o backend remoto
 */

const https = require('https');
const http = require('http');

// Configurações
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testBackendHealth() {
  console.log('🔍 Testando health check do backend...');
  console.log(`📍 URL: ${BACKEND_URL}/health`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend está funcionando!');
      console.log('📊 Resposta:', JSON.parse(response.data));
      return true;
    } else {
      console.log(`❌ Backend retornou status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com backend:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n🔍 Testando CORS...');
  console.log(`📍 Frontend: ${FRONTEND_URL}`);
  console.log(`📍 Backend: ${BACKEND_URL}`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/public/restaurants`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    console.log('📊 Headers CORS:', corsHeaders);
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log('✅ CORS configurado corretamente!');
      return true;
    } else {
      console.log('❌ CORS não configurado ou bloqueado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar CORS:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔍 Testando endpoints da API...');
  
  const endpoints = [
    { path: '/api/public/restaurants', method: 'GET', name: 'Restaurantes' },
    { path: '/api/public/menu-items', method: 'GET', name: 'Itens de Menu' },
    { path: '/health', method: 'GET', name: 'Health Check' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando ${endpoint.name}...`);
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Origin': FRONTEND_URL
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name} - OK`);
        successCount++;
      } else {
        console.log(`❌ ${endpoint.name} - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Erro: ${error.message}`);
    }
  }
  
  return successCount === endpoints.length;
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testando conexão com banco de dados...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/public/restaurants`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log(`✅ Banco conectado - ${data.length} restaurantes encontrados`);
      return true;
    } else {
      console.log(`❌ Erro ao acessar banco - Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar banco:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de integração Frontend Local + Backend Remoto');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: testBackendHealth },
    { name: 'CORS', fn: testCORS },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Database Connection', fn: testDatabaseConnection }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ Erro no teste ${test.name}:`, error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Resultado: ${passedTests}/${tests.length} testes passaram`);
  
  if (passedTests === tests.length) {
    console.log('🎉 Todos os testes passaram! Integração funcionando perfeitamente!');
    console.log('\n🚀 Próximos passos:');
    console.log('1. Execute o frontend: npm run dev');
    console.log('2. Acesse: http://localhost:5173');
    console.log('3. Teste as funcionalidades da aplicação');
  } else {
    console.log('❌ Alguns testes falharam. Verifique as configurações.');
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se o backend está rodando');
    console.log('2. Verificar configuração CORS');
    console.log('3. Verificar conectividade de rede');
    console.log('4. Verificar logs do backend');
  }
}

// Executar testes
runTests().catch(console.error);
