# Sallon pro manager pro - Histórico de Funcionalidades e Atualizações

Este documento detalha o estado atual do sistema, suas funcionalidades principais e todas as transformações e melhorias implementadas recentemente.

---

## 💎 Nova Identidade Visual (Rebranding Premium)
Recentemente, o sistema passou por uma reformulação visual completa para transmitir mais profissionalismo e exclusividade.
- **Nova Logo Oficial:** Substituição de ícones genéricos por uma marca personalizada e moderna disponível em todo o sistema.
- **Tipografia e Estilo:** Aplicação de gradientes "premium" e estilo itálico na marca **Sallon Pro Manager** em layouts internos e públicos.
- **Consistência Visual:** Unificação da identidade na Landing Page, Tela de Login/Cadastro, Dashboard de Usuário, Página de Agendamento Online e Painel de Super Admin.

---

## 💰 Sistema de Comissionamento e Financeiro
Uma das atualizações mais importantes para a saúde financeira da barbearia.
- **Automação de Comissões:** Ao concluir um agendamento, o sistema agora calcula automaticamente a parte do barbeiro e a parte da loja.
- **Registro Automático:** Gera automaticamente uma entrada de receita (valor total) e uma saída de despesa (comissão) vinculada ao profissional.
- **Relatórios Avançados:**
  - Card de resumo de "Total de Comissões" pagas.
  - Gráfico de barras comparativo de comissões por profissional.
  - Tabela detalhada de serviços com coluna específica de lucro líquido e comissões.
- **Padronização de API:** Unificação dos endpoints `/transactions` para garantir integridade absoluta dos dados financeiros.

---

## 🛠️ Painel do Super Administrador (Gestão SaaS)
Funcionalidades para gestão centralizada do software como serviço.
- **Visualização de Tenants:** Lista completa de barbearias cadastradas com busca inteligente por nome ou e-mail.
- **Gestão de Status:** Possibilidade de **Suspender** ou **Ativar** contas de clientes diretamente pelo painel.
- **Upgrade/Downgrade de Planos:** Alteração manual do plano de qualquer cliente (Bronze, Silver, Gold).
- **Editor de Planos Global:** Ajuste em tempo real de preços (Mensal/Anual) e limites de recursos (ex: limite de barbeiros, acesso a estoque/relatórios).
- **Monitoramento:** Dashboard com saúde das APIs (Firebase, WhatsApp, etc.).

---

## 👥 Gestão de Profissionais e Limites
- **Correção de Fluxo:** Ajuste no botão "Adicionar Profissional" para que respeite rigorosamente os limites do plano contratado pelo cliente.
- **Configuração Individual:** Cada profissional pode ter sua própria porcentagem de comissão e seu próprio portfólio de fotos.

---

## 🔒 Segurança e Recuperação
- **Recuperação de Senha:** Implementação de fluxo completo de "Esqueci minha senha" utilizando tokens seguros para redefinição.
- **Autenticação:** Proteção de rotas administrativas e validação de permissões de Super Admin.

---

## 📜 Funcionalidades Base (Core)
- **Agendamento Online Público:** Link exclusivo para clientes agendarem sem cadastro.
- **Dashboard de Operações:** Visão geral diária de agendamentos e caixa.
- **Sistema de Fidelidade:** Acúmulo de pontos e visitas automático por cliente.
- **Gestão de Estoque:** Controle de produtos com alertas de estoque baixo.
- **Integração WhatsApp:** Envio automático de confirmações de agendamento.

---

## 🛒 PDV e Estabilidade do Sistema
Melhorias contínuas na ferramenta de frente de caixa e robustez do código.
- **Correções Críticas:** Ajustes em formatações de data e hora que preveniram travamentos no PDV.
- **Sincronização:** Integração total entre o Ponto de Venda e os débitos de agendamentos (No-show).

---

## 🤖 Automação e Inteligência
- **Inteligência Preditiva (Business Intelligence):**
  - Algoritmo de Churn: Identifica clientes em risco (atraso de 1.5x o intervalo médio).
  - Previsão de Caixa: Projeção baseada em média de 3 meses e Break-even automático.
  - Upsell Inteligente: Banner no PDV sugerindo reposição de produtos baseada no ciclo de uso.
- **Automação de Relatórios:**
  - Envio semanal via WhatsApp (WAHA) toda segunda-feira às 09:00 (Churn + Aniversariantes).
- **UX/UI Premium (Dark Glassmorphism):**
  - Redesenho completo das telas de Serviços e Configurações inspirado em referências de alto nível.
  - Implementação de Toggles modernos e Inputs em Dark Mode.
- **Módulo de Pacotes e Planejamento:**
  - Criação de Pacotes Mensais (ex: Assinatura de 4 cortes).
  - Visão de Agenda Semestral e Anual para planejamento estratégico de longo prazo.
  - Atalhos de duração (1 mês, 6 meses, 1 ano) para criação rápida de séries recorrentes.

---

## 💳 Assinaturas e SaaS (Asaas)
- **Correção de Fluxo:** Resolução de erros 404 que impediam o carregamento de pagamentos na tela de planos.
- **Integração PIX/Cartão:** Estabilização do checkout com geração de QR Code PIX e processamento via API do Asaas.
- **Rotas de API:** Padronização de endpoints singulares/plurais para compatibilidade total entre frontend e backend.

---

## 🦶 Fichas de Anamnese (Podologia)
Uma solução especializada para profissionais de podologia integrada ao cadastro de clientes.
- **Mapeamento Visual (Feet Map):** Ferramenta interativa de desenho para marcar condições nos pés (dor, calos, etc.) diretamente na tela.
- **Assinaturas Digitais:** Coleta de assinaturas do paciente e do profissional diretamente no dispositivo.
- **Histórico Centralizado:** Todas as fichas salvas ficam acessíveis no perfil do cliente para consulta rápida.
- **Exportação PDF:** Geração de documento PDF profissional com todas as informações e assinaturas para impressão ou compartilhamento.

---

## 🏦 Módulo Financeiro Avançado
Expansão robusta do controle financeiro para gestão completa do negócio.
- **Contas a Receber:** Gestão de pagamentos futuros, permitindo acompanhar o que o salão tem a receber de cartões e vendas na conta (pendura).
- **Contas a Pagar:** Controle de despesas agendadas, permitindo lançar contas fixas e variáveis com datas de vencimento.
- **Parcelamento de Vendas:** O PDV agora permite dividir vendas de produtos e serviços em até 12x, gerando automaticamente múltiplas parcelas no Contas a Receber.
- **Crediário da Casa:** Novo método de pagamento "Crediário" no PDV, permitindo parcelar vendas diretamente para o cliente (sem cartão), com acompanhamento rigoroso de parcelas pendentes.
- **Gestão de Taxas de Cartão:** Possibilidade de informar a taxa da máquina no momento da venda. O sistema calcula automaticamente o valor líquido e registra a taxa como uma despesa administrativa automática.
- **Relatórios de Gastos Detalhados:** Nova aba de "Relatórios" que categoriza todos os gastos do dono do salão, mostrando porcentagens e gráficos de barras para identificar onde o dinheiro está sendo gasto (ex: Aluguel, Produtos, Taxas, Comissões).
- **Fluxo de Caixa Consolidado:** Dashboard financeiro com abas separadas para Fluxo Realizado, Pendências de Entrada e Pendências de Saída.
- **Saldo Previsto:** Cálculo inteligente que projeta o saldo futuro considerando o dinheiro em caixa somado às entradas pendentes e subtraído das saídas agendadas.
- **Liquidação de Parcelas:** Interface intuitiva para confirmar recebimentos e pagamentos com um único clique.

---

## 🛡️ Infraestrutura e Segurança
- **Segurança de Kernel:** Mitigação da vulnerabilidade "Copy Fail" (CVE-2026-31431) no servidor de produção via configuração de segurança de módulos.
- **Build de Produção:** Otimização do processo de deploy via Docker para garantir que assets (imagens/scripts) sejam carregados corretamente em produção.

---

> [!NOTE]
> Este log reflete as atualizações realizadas até **Maio de 2026**. O sistema continua em constante evolução para se tornar a ferramenta definitiva para gestão de barbearias e clínicas de estética de alto nível.
