INSERT INTO wallets (id, "ownerUid", balance, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 10.00, true, now(), now()
FROM users WHERE email = 'admin2@sallonpm.com'
ON CONFLICT ("ownerUid") DO UPDATE SET balance = 10.00, "isActive" = true;

INSERT INTO wallet_transactions (id, "walletId", type, category, amount, description, "createdAt")
SELECT gen_random_uuid(), id, 'credit', 'recharge', 10.00, 'Recarga de Teste (Manual)', now()
FROM wallets WHERE "ownerUid" = (SELECT id FROM users WHERE email = 'admin2@sallonpm.com');
