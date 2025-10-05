# Ferramentas para Conectar ao AWS RDS PostgreSQL

## 🔗 String de Conexão
```
Host: amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com
Port: 5432
Database: amadelivery
Username: amadelivery
Password: amadelivery
```

## 🛠️ Ferramentas Recomendadas

### 1. **pgAdmin** (Gratuito)
- Download: https://www.pgadmin.org/
- Interface gráfica completa
- Suporte a PostgreSQL

### 2. **DBeaver** (Gratuito)
- Download: https://dbeaver.io/
- Suporte a múltiplos bancos
- Interface moderna

### 3. **DataGrip** (JetBrains - Pago)
- Download: https://www.jetbrains.com/datagrip/
- IDE completa para bancos
- Recursos avançados

### 4. **TablePlus** (Mac/Windows - Pago)
- Download: https://tableplus.com/
- Interface elegante
- Suporte nativo PostgreSQL

## 🔧 Configuração de Conexão

### Parâmetros para qualquer ferramenta:
```
Host: amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com
Port: 5432
Database: amadelivery
Username: amadelivery
Password: amadelivery
SSL Mode: Require (recomendado)
```

## 📊 Queries Úteis

### Ver todos os usuários:
```sql
SELECT id, full_name, email, role, telefone, created_date 
FROM users 
ORDER BY created_date DESC;
```

### Ver todos os restaurantes:
```sql
SELECT id, nome, categoria, ativo, rating, taxa_entrega 
FROM restaurants 
WHERE ativo = true;
```

### Ver pedidos recentes:
```sql
SELECT numero_pedido, cliente_nome, cliente_email, total, status, created_date 
FROM orders 
ORDER BY created_date DESC 
LIMIT 10;
```

### Estatísticas gerais:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM restaurants) as total_restaurants,
  (SELECT COUNT(*) FROM menu_items) as total_menu_items,
  (SELECT COUNT(*) FROM orders) as total_orders;
```
