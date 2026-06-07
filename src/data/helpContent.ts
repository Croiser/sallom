export interface HelpContent {
  title: string;
  description: string;
  faqs: { q: string; a: string }[];
  troubleshooting: { problem: string; solution: string }[];
}

export const helpContent: Record<string, HelpContent> = {
  'dashboard': {
    title: 'Dashboard Geral',
    description: 'Acompanhe as métricas e indicadores de saúde do seu salão em tempo real.',
    faqs: [
      { q: 'O que o Dashboard mostra?', a: 'O dashboard mostra um resumo financeiro, total de agendamentos, clientes novos e a taxa de retorno.' },
      { q: 'Com que frequência os dados são atualizados?', a: 'Os dados do dashboard são atualizados em tempo real conforme novos agendamentos e vendas ocorrem.' }
    ],
    troubleshooting: [
      { problem: 'Meus gráficos estão zerados, por quê?', solution: 'Verifique se você registrou receitas ou agendamentos no mês atual. O filtro padrão do Dashboard é o mês vigente.' }
    ]
  },
  'appointments': {
    title: 'Agendamentos',
    description: 'Gerencie sua agenda, veja horários disponíveis e marque novos clientes.',
    faqs: [
      { q: 'Como marco um novo horário?', a: 'Clique no botão "Novo Agendamento", escolha o cliente, o serviço, o profissional e o horário. Depois confirme.' },
      { q: 'Posso bloquear horários?', a: 'Sim, você pode registrar uma ausência para o profissional ou usar o módulo de feriados nas configurações.' }
    ],
    troubleshooting: [
      { problem: 'Não consigo agendar em um horário específico.', solution: 'Verifique se o profissional já tem outro agendamento neste mesmo horário ou se está fora do horário de funcionamento configurado na aba Configurações.' },
      { problem: 'O cliente não recebeu o aviso de WhatsApp.', solution: 'Confirme se o número do cliente possui o DDD correto e se a aba "WhatsApp" (ou "Conexão WhatsApp") indica que seu aparelho está conectado.' }
    ]
  },
  'clients': {
    title: 'Base de Clientes',
    description: 'Mantenha o cadastro e o histórico completo de todos os seus clientes.',
    faqs: [
      { q: 'Como vejo o histórico do cliente?', a: 'Na lista de clientes, clique em "Ver Perfil" (ou no ícone de olho) ao lado do nome dele.' },
      { q: 'O que são os pontos de fidelidade?', a: 'Sempre que o cliente comparece a um agendamento, ele ganha pontos que podem ser trocados por prêmios configurados no sistema.' }
    ],
    troubleshooting: [
      { problem: 'Cadastrei um cliente duplicado, o que faço?', solution: 'Atualmente o sistema não possui mescla automática. Você pode excluir o registro mais recente e manter o original.' }
    ]
  },
  'services': {
    title: 'Catálogo de Serviços',
    description: 'Configure os procedimentos que seu salão oferece, incluindo duração e preço.',
    faqs: [
      { q: 'Como alterar o preço de um serviço?', a: 'Basta ir na lista de serviços, clicar em "Editar" e informar o novo valor.' },
      { q: 'O que significa "Duração"?', a: 'É o tempo que este serviço bloqueia na agenda do profissional.' }
    ],
    troubleshooting: [
      { problem: 'Excluí um serviço sem querer, posso recuperar?', solution: 'Infelizmente, não. Mas todos os agendamentos antigos que usaram esse serviço não serão apagados, apenas perderão o vínculo ativo.' }
    ]
  },
  'inventory': {
    title: 'Estoque e Produtos',
    description: 'Controle de entrada e saída de produtos, além de avisos de estoque baixo.',
    faqs: [
      { q: 'Como faço uma venda de produto?', a: 'Acesse a aba "PDV / Vendas" e adicione o produto ao carrinho do cliente.' },
      { q: 'Serei avisado se o produto acabar?', a: 'Sim, na aba Estoque haverá alertas para os produtos que estiverem com quantidade menor que o mínimo estipulado (por padrão, 5).' }
    ],
    troubleshooting: [
      { problem: 'A quantidade de produtos não bate com o físico.', solution: 'Você pode realizar um "Ajuste de Estoque". Edite o produto e atualize a quantidade para refletir a contagem real.' }
    ]
  },
  'finance': {
    title: 'Gestão Financeira',
    description: 'Controle de caixa, receitas, despesas e comissões.',
    faqs: [
      { q: 'Os agendamentos caem direto no financeiro?', a: 'Sim. Quando você marca um agendamento como "Finalizado" (ou pelo PDV), o valor da venda gera uma transação de Receita automaticamente.' },
      { q: 'Como eu pago a comissão do barbeiro/cabeleireiro?', a: 'O sistema calcula as comissões na tela "Profissionais" ou em "Relatórios". Você pode gerar um vale ou registrar uma despesa no dia do pagamento.' }
    ],
    troubleshooting: [
      { problem: 'Uma despesa não aparece no resumo do mês.', solution: 'Confirme se a "Data da Despesa" foi preenchida para o mês que você está visualizando no filtro.' }
    ]
  },
  'settings': {
    title: 'Configurações',
    description: 'Horário de funcionamento, dados do salão e profissionais.',
    faqs: [
      { q: 'Onde mudo a cor/logo do meu salão?', a: 'Na aba Configurações, busque por "Personalização" ou "Dados do Salão".' },
      { q: 'Como defino dias de folga do salão?', a: 'Você pode desmarcar a chave "Aberto" nos dias de funcionamento da semana ou adicionar uma data na lista de "Feriados".' }
    ],
    troubleshooting: [
      { problem: 'Não consigo alterar meu e-mail.', solution: 'Para alterar o e-mail de acesso principal, por questões de segurança, entre em contato com o suporte.' }
    ]
  },
  'whatsapp': {
    title: 'WhatsApp e Automação',
    description: 'Configure lembretes automáticos e conexões de celular.',
    faqs: [
      { q: 'O celular precisa ficar ligado?', a: 'Sim. Como usamos a conexão via WhatsApp Web (QR Code), seu aparelho precisa estar conectado à internet.' },
      { q: 'Quando o lembrete é enviado?', a: 'Os lembretes são disparados automaticamente pelo sistema algumas horas ou 1 dia antes do horário marcado (conforme automação padrão do sistema).' }
    ],
    troubleshooting: [
      { problem: 'O status do WhatsApp diz "Desconectado".', solution: 'Acesse a aba "Conexão WhatsApp", aguarde gerar um novo QR Code e escaneie com seu celular, como se fosse entrar no WhatsApp Web.' }
    ]
  },
  'default': {
    title: 'Ajuda',
    description: 'Encontre respostas para as perguntas mais comuns e resolva problemas rapidamente.',
    faqs: [
      { q: 'Como entro em contato com o suporte humano?', a: 'No menu esquerdo, vá em "Ajuda" e clique no botão do WhatsApp.' }
    ],
    troubleshooting: [
      { problem: 'Sistema lento ou tela branca.', solution: 'Tente recarregar a página (F5) ou limpar o cache do navegador. Se o erro persistir, nos chame no suporte.' }
    ]
  }
};
