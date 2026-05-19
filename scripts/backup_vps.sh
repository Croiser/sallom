#!/bin/bash
# SallonPro Backup Script
# Realiza o backup diário do banco de dados PostgreSQL e limpa arquivos antigos.

PROJECT_DIR="/root/salaopromanager"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Garantir que a pasta de backup existe
mkdir -p "$BACKUP_DIR"

echo "--------------------------------------------------"
echo "Iniciando backup em: $(date)"

# Backup do Banco de Dados (via Docker)
# Nota: Usamos -T para evitar erro de entrada TTY no cron
FILENAME="sallonpro_db_$TIMESTAMP.sql"
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U salonuser salondb > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    echo "Dump do banco concluído: $FILENAME"
    # Comprimir para economizar espaço
    gzip "$BACKUP_DIR/$FILENAME"
    echo "Arquivo comprimido: $FILENAME.gz"
else
    echo "ERRO ao realizar dump do banco!"
    exit 1
fi

# Política de Retenção (Manter últimos 7 dias)
echo "Limpando backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name "sallonpro_db_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "Backup finalizado com sucesso."
echo "--------------------------------------------------"
