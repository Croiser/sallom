@echo off
echo Starting SalaoProManager locally...

REM Set environment variables
set DATABASE_URL=postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public
set NODE_ENV=production

echo.
echo Starting backend server...
start "SalaoProManager Backend" npx ts-node server/index.ts

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak

echo.
echo Access the application at: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
