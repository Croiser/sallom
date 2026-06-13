-- Limpar upsells vinculados aos agendamentos
DELETE FROM "appointment_upsells";

-- Desvincular agendamentos das vendas (se houver vendas criadas a partir de agendamentos)
UPDATE "sales" SET "appointmentId" = NULL WHERE "appointmentId" IS NOT NULL;

-- Remover todos os agendamentos
DELETE FROM "appointments";

-- Remover todos os grupos de recorrência de agendamentos
DELETE FROM "recurrence_groups";

-- Opcional: Se desejar apagar também o histórico financeiro (vendas e transações) descomente as linhas abaixo:
-- DELETE FROM "sale_items";
-- DELETE FROM "sales";
-- DELETE FROM "transactions";
