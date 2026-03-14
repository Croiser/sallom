#!/bin/bash

# Script de Deploy Automático - Barbeiro Manager pro
echo "🚀 Iniciando processo de deploy..."

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Migrar Banco de Dados
echo "🗄️ Executando migrações do Prisma..."
npx prisma migrate deploy

# 3. Rodar Seed (Garantir planos e admin)
echo "🌱 Populando banco de dados (Seed)..."
npx ts-node prisma/seed.ts

# 4. Build Final
echo "🏗️ Gerando build de produção..."
npm run build

# 5. Reiniciar Serviço (Opcional - Exemplo com PM2)
# echo "♻️ Reiniciando serviço com PM2..."
# pm2 restart server.ts --name barbeiromanager

echo "✅ Deploy concluído com sucesso!"
echo "Não esqueça de verificar se o Docker da Evolution API está rodando: docker ps"
