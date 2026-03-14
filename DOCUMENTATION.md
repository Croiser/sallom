# Barbeiro Manager pro - Documentação do Sistema

Este documento fornece uma visão geral das funcionalidades do sistema **Barbeiro Manager pro**, instruções de configuração em uma VPS e um guia de uso para o usuário final.

---

## 🚀 Funcionalidades Principais

O Barbeiro Manager pro é uma solução completa para gestão de barbearias, focada em produtividade e experiência do cliente.

### 1. Dashboard Inteligente
*   **Métricas em Tempo Real**: Visualize faturamento total, despesas, agendamentos do dia e clientes ativos.
*   **Gráficos de Desempenho**: Acompanhe a evolução financeira semanal.
*   **Ações Rápidas**: Gerencie os próximos agendamentos diretamente da tela inicial.

### 2. Gestão de Agendamentos
*   **Múltiplas Visualizações**: Calendário mensal, semanal e lista detalhada.
*   **Status de Agendamento**: Marque como "Agendado", "Concluído" ou "Cancelado".
*   **Encaixes**: Funcionalidade para marcar horários de encaixe.
*   **Notificações**: Confirmação visual (Toast) após cada criação.
*   **Agendamento Online Público**: Link exclusivo (`/book/slug`) para que clientes agendem seus próprios horários sem precisar de login.

### 3. Módulo Financeiro e Comissões
*   **Receita Automática**: Ao concluir um agendamento, o valor do serviço é registrado automaticamente como entrada.
*   **Cálculo de Comissões**: O sistema calcula automaticamente a parte do profissional com base na porcentagem configurada e gera um lançamento de despesa.
*   **Controle de Despesas**: Registro manual de gastos (aluguel, produtos, luz, etc.).
*   **Resumo de Caixa**: Saldo atualizado em tempo real.

### 4. Gestão de Clientes e Fidelidade
*   **Base de Clientes**: Histórico de contatos e agendamentos.
*   **Sistema de Fidelidade**: Acúmulo automático de pontos e contador de visitas a cada serviço concluído.
*   **Gestão de Profissionais**: Cadastro de barbeiros com controle de comissões, portfólio de fotos e agendas individuais.

### 5. Estoque e Produtos
*   **Controle de Inventário**: Cadastro de produtos com quantidade em estoque.
*   **Alertas de Reposição**: Identificação visual de produtos com estoque baixo.

### 6. Integração com WhatsApp
*   **Confirmações Automáticas**: O sistema dispara mensagens de confirmação para o cliente via WhatsApp no momento do agendamento.

### 7. Sistema de Assinaturas (SaaS)
*   **Checkout Integrado**: Integração com a API do Asaas para pagamentos via Pix, Cartão e Boleto.
*   **Planos Flexíveis**: Gestão de planos Bronze, Silver e Gold.

### 8. Painel do Super Administrador
*   **Gestão de Tenants**: Visualize e gerencie todas as barbearias cadastradas.
*   **Editor de Planos**: Altere preços e recursos dos planos globalmente.
*   **Métricas Globais**: Acompanhe o faturamento total do SaaS e crescimento da base de usuários.
*   **Monitoramento de APIs**: Status em tempo real das integrações (Firebase, WhatsApp, etc.).

---

## 🛠 Configuração na VPS (Ubuntu/Debian)

Siga estes passos para colocar o sistema em produção em um servidor virtual.

### 1. Requisitos Prévios
*   Servidor com Ubuntu 22.04 ou superior.
*   Node.js (v18+) e NPM instalados.
*   Nginx instalado.

### 2. Preparação do Ambiente
```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale o Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Instalação do Projeto
```bash
# Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>
cd barber-manager

# Instale as dependências
npm install
```

### 4. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_EVOLUTION_API_URL=http://seu-servidor-evolution:8080
VITE_EVOLUTION_API_KEY=sua_api_key_global
```

### 5. Configuração do Firebase
Certifique-se de que o arquivo `src/firebase-applet-config.json` contém as credenciais corretas do seu projeto Firebase (API Key, Project ID, etc.).

### 6. Build de Produção
```bash
# Gere os arquivos estáticos
npm run build
```
Os arquivos serão gerados na pasta `dist/`.

### 7. Configuração do Nginx
Crie um arquivo de configuração para o site:
```bash
sudo nano /etc/nginx/sites-available/barbeiromanager
```
Adicione o conteúdo abaixo (ajustando o domínio):
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /caminho/para/o/projeto/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/barbeiromanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL (HTTPS) com Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

---

## 📱 Integração WhatsApp (Evolution API)

O sistema utiliza a **Evolution API** para o envio de mensagens. Para que funcione corretamente em sua VPS:
1.  Instale a Evolution API (recomendado via Docker).
2.  Configure a URL e a API Key no arquivo `.env` do Barbeiro Manager pro.
3.  No sistema, acesse o módulo **WhatsApp**, gere o QR Code e escaneie com seu aparelho.

---

## 📖 Guia de Uso

### Passo 1: Configuração Inicial
Ao acessar pela primeira vez, vá em **Serviços** e cadastre os cortes e tratamentos que sua barbearia oferece. Em seguida, em **Configurações**:
1.  Cadastre os profissionais da equipe.
2.  Defina a **Porcentagem de Comissão** de cada um.
3.  Adicione fotos ao **Portfólio** dos barbeiros para atrair clientes no agendamento online.
4.  Personalize o seu **Link de Agendamento Online** (Slug).

### Passo 2: O Dia a Dia
1.  Divulgue seu link de agendamento nas redes sociais.
2.  Acompanhe os novos agendamentos que chegam automaticamente.
3.  Após o serviço, clique no botão de **Check (Concluir)**. Isso irá:
    *   Registrar a entrada no **Financeiro**.
    *   Calcular e lançar a **Comissão** do profissional como despesa.
    *   Adicionar **Pontos de Fidelidade** e visitas ao perfil do cliente.

### Passo 3: Gestão de Estoque
Sempre que chegar novos produtos, atualize as quantidades no módulo de **Estoque**. O sistema avisará quando for hora de comprar mais.

### Passo 4: Relatórios
No final do mês, acesse o módulo de **Relatórios** para ver o crescimento da sua barbearia e quais serviços são os mais procurados.

### 9. Nova Identidade Visual (Rebranding Premium)
*   **Logo Criativa**: Substituição de ícones genéricos por uma marca personalizada.
*   **Design Sofisticado**: Interface atualizada com gradientes e tipografia premium para uma experiência "Barbeiro Manager pro" autêntica.

---

## 📜 Histórico de Atualizações
Para um log detalhado de todas as mudanças recentes (como recuperação de senha, automação de comissões e gestão de SaaS), consulte o arquivo:
👉 [HISTORICO_E_FUNCIONALIDADES.md](file:///c:/BARBEIROMANAGERPRO/HISTORICO_E_FUNCIONALIDADES.md)

---

*Documentação gerada e atualizada automaticamente para o sistema Barbeiro Manager pro.*
