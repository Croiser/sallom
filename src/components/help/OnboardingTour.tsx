import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export default function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: 'Bem-vindo ao Salão Pro Manager! 🎉 Vamos fazer um rápido tour para te mostrar como navegar.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#menu-dashboard',
      content: 'Aqui no Dashboard você terá uma visão geral das suas métricas, faturamento e agendamentos do dia.',
      placement: 'right',
    },
    {
      target: '#menu-appointments',
      content: 'Este é o coração do sistema: sua Agenda! Aqui você cria, edita e visualiza todos os agendamentos.',
      placement: 'right',
    },
    {
      target: '#menu-clients',
      content: 'Acesse sua base de clientes, veja o histórico de cada um e o programa de fidelidade.',
      placement: 'right',
    },
    {
      target: '#menu-finance',
      content: 'Todo agendamento finalizado vem para cá. Você também pode lançar despesas e ver seu lucro.',
      placement: 'right',
    },
    {
      target: '#btn-support',
      content: 'Precisa de ajuda? Clique aqui em qualquer tela para ver dicas e solucionar problemas específicos daquela tela!',
      placement: 'bottom',
    }
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#f43f5e', // text-rose-500
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#f43f5e',
          borderRadius: '8px',
          fontWeight: 'bold',
        },
        buttonBack: {
          marginRight: 10,
          color: '#52525b',
        },
        buttonSkip: {
          color: '#52525b',
        }
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour'
      }}
    />
  );
}
