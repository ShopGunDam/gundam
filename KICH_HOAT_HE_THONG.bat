@echo off
title KICH HOAT HE THONG GUNDAM STORE
color 0b

echo ===================================================
echo    DANG KHOI TAO HE THONG BACKEND ^& FRONTEND
echo ===================================================

:: 1. Kiem tra va cai dat thu vien (luon kiem tra de dam bao du multer)
echo [+] Dang kiem tra thu vien he thong...
call npm install

:: 2. Chay Server Node.js trong mot cua so moi
echo [+] Dang khoi chay Server Node.js tai Port 5000...
start cmd /k "node server.js"

:: 3. Doi mot chut cho server khoi dong
timeout /t 3 /nobreak > nul

:: 4. Mo trang web tren trinh duyet
echo [+] Dang mo trang Cua Hang...
start index.html

echo ===================================================
echo    KICH HOAT THANH CONG! CHUC BAN TRAI NGHIEM VUI VE
echo ===================================================
pause
