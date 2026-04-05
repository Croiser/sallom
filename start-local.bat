@echo off
set DATABASE_URL=postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public
set NODE_ENV=production
npm run dev
