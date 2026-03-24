# Guia de Configuração VPS - Dodile

Este guia explica como colocar o Dodile em produção na sua VPS para suportar múltiplas barbearias.

## 1. Requisitos na VPS
*   Docker e Docker Compose instalados.
*   Nginx instalado.

## 2. Configuração de DNS
No seu painel de domínio (ex: Registro.br ou Cloudflare):
1.  Crie um registro **A** apontando `@` para o IP da sua VPS.
2.  Crie um registro **A** apontando `*` (wildcard) para o IP da sua VPS.

## 3. Configuração do Nginx (Proxy Reverso)
Crie um arquivo em `/etc/nginx/sites-available/dodile` com o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name dodile.com.br *.dodile.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Ative o site: `ln -s /etc/nginx/sites-available/dodile /etc/nginx/sites-enabled/` e reinicie o Nginx: `systemctl restart nginx`.

## 4. Rodando o Aplicativo
1.  Suba os arquivos do projeto para a VPS.
2.  No terminal da VPS, na pasta do projeto, execute:
    ```bash
    docker-compose up -d --build
    ```
3.  Execute as migrações do banco de dados:
    ```bash
    docker-compose exec app npx prisma migrate deploy
    ```

## 5. SSL (HTTPS Gratuito)
Use o Certbot para gerar certificados para o domínio principal e subdomínios:
```bash
sudo certbot --nginx -d dodile.com.br -d *.dodile.com.br
```

---
**Nota:** O banco de dados PostgreSQL será criado automaticamente pelo Docker Compose. Os dados ficarão salvos no volume `postgres_data`.
