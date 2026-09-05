param(
  [Parameter(Mandatory = $true)]
  [string]$MotDePassePostgres
)

$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$env:PGPASSWORD = $MotDePassePostgres

Write-Host "Création de la base matemedical..."
& $psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE matemedical;" 2>$null

$env:DATABASE_URL = "postgresql://postgres:$MotDePassePostgres@localhost:5432/matemedical?schema=public"
Set-Content -Path "$PSScriptRoot\..\backend\.env" -Value @"
DATABASE_URL=$env:DATABASE_URL
PORT_API=4000
URL_FRONTEND=http://localhost:3000
JWT_SECRET=matemedical-dev-local
JWT_EXPIRATION=7d
NODE_ENV=development
"@

Set-Location "$PSScriptRoot\..\backend"
npm run db:preparer
