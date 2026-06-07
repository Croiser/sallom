UPDATE "wallets"
SET balance = balance + 200
FROM "users"
WHERE "wallets"."ownerUid" = "users"."id"
  AND "users"."email" = 'lucyr8585@gmail.com';
