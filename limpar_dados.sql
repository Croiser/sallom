-- ============================================
-- SCRIPT DE LIMPEZA GERAL (Agendamentos e Financeiro)
-- Mantém clientes, usuários, serviços, configurações, etc.
-- ============================================

-- 1. DADOS DE AGENDAMENTO
-- Limpar upsells vinculados aos agendamentos
DELETE FROM "appointment_upsells";

-- Desvincular agendamentos das vendas (se houver vendas criadas a partir de agendamentos)
UPDATE "sales" SET "appointmentId" = NULL WHERE "appointmentId" IS NOT NULL;

-- Remover todos os agendamentos e recorrências
DELETE FROM "appointments";
DELETE FROM "recurrence_groups";


-- 2. DADOS FINANCEIROS
-- Remover itens de vendas e vendas
DELETE FROM "sale_items";
DELETE FROM "sales";

-- Remover todas as transações (receitas/despesas)
DELETE FROM "transactions";

-- Limpar histórico de carteiras (wallets) e zerar saldo
DELETE FROM "wallet_transactions";
UPDATE "wallets" SET "balance" = 0;

-- ============================================
-- Fim do script
-- ============================================
