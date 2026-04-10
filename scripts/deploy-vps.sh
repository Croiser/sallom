#!/bin/bash
# =============================================================
# Sallon Pro Manager — Deploy Script (VPS)
# Executa na VPS após: git push origin main (build já feito)
#
# O que este script faz:
#   1. Autentica no GitHub Container Registry (ghcr.io)
#   2. Pull da nova imagem :latest
#   3. Recria o container da app com zero downtime
#   4. Executa a migration do banco (novos campos de agenda)
#   5. Verifica se a app subiu corretamente
# =============================================================

set -e  # Sai imediatamente em caso de erro

# ---- CONFIGURAÇÕES ---- (ajuste se necessário)
GITHUB_TOKEN=""            # Cole seu Personal Access Token (read:packages)
GITHUB_USER="Croiser"
IMAGE="ghcr.io/croiser/sallom:latest"
COMPOSE_FILE="/opt/sallom/docker-compose.yml"   # Ajuste o caminho real
APP_DIR="/opt/sallom"                             # Ajuste o caminho real
# -----------------------

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Sallon Pro Manager — Deploy v$(date +%Y%m%d)     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Login no GHCR (necessário para imagens privadas)
echo "📦 [1/5] Autenticando no GitHub Container Registry..."
if [ -n "$GITHUB_TOKEN" ]; then
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
else
  echo "⚠  GITHUB_TOKEN não definido — pulando login (só funciona com imagem pública)"
fi

# 2. Pull da nova imagem
echo ""
echo "⬇  [2/5] Baixando nova imagem: $IMAGE"
docker pull "$IMAGE"

# 3. Parar e recriar apenas o container da app (DB e WAHA continuam rodando)
echo ""
echo "♻  [3/5] Recriando container da app..."
cd "$APP_DIR"
docker-compose up -d --no-deps --force-recreate app

# Aguarda a app inicializar
echo "    Aguardando 15s para a app inicializar..."
sleep 15

# 4. Executar migrations do banco (novos campos: agenda recorrente + combos)
echo ""
echo "🗃  [4/5] Aplicando migrations do banco de dados..."
docker-compose exec -T app npx prisma migrate deploy

# 5. Verificação de saúde
echo ""
echo "🏥 [5/5] Verificando saúde da aplicação..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/plans || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "✅ Deploy concluído com sucesso!"
  echo "   Imagem: $IMAGE"
  echo "   Status HTTP: $HTTP_STATUS"
  echo "   Hora: $(date)"
else
  echo ""
  echo "⚠  Aplicação respondeu com status: $HTTP_STATUS"
  echo "   Verifique os logs: docker-compose logs --tail=50 app"
fi

echo ""
echo "📋 Últimas 20 linhas de log:"
docker-compose logs --tail=20 app
