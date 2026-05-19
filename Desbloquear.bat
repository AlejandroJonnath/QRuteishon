@echo off
title Desbloquear Proyecto - QRuteishon
cls
color 0B
echo.
echo   =========================================================
echo     DESBLOQUEAR ENTORNO DE DESARROLLO - QRUTEISHON
echo   =========================================================
echo.
echo   [SISTEMA PROTEGIDO] El codigo fuente esta cifrado con AES-256-CBC.
echo.
set /p KEY="  [CLAVE] Ingresa la clave de seguridad: "
echo.

if "%KEY%"=="" goto EMPTY_KEY

echo   [PROCESANDO] Descifrando archivos...
node scripts\crypt-env.js decrypt "%KEY%"

set EXIT_CODE=%ERRORLEVEL%
echo.

if %EXIT_CODE% equ 0 goto SUCCESS
if %EXIT_CODE% equ 2 goto WRONG_KEY
goto GENERIC_ERROR

:EMPTY_KEY
color 0C
echo   [ERROR] La clave no puede estar vacia.
echo.
echo   Presiona cualquier tecla para salir...
pause > nul
exit /b

:SUCCESS
color 0A
echo   =========================================================
echo     ¡DESBLOQUEO EXITOSO! Carpetas restauradas con exito.
echo   =========================================================
echo   Ahora puedes abrir VS Code o ejecutar "npm run start".
goto END

:WRONG_KEY
color 0C
echo   [ERROR] La clave de descifrado es incorrecta.
echo   El codigo fuente permanece protegido y cifrado.
goto END

:GENERIC_ERROR
color 0E
echo   [ERROR DEL SISTEMA] Ocurrio un fallo inesperado.
echo   Asegurate de tener Node.js instalado.
goto END

:END
echo.
echo   Presiona cualquier tecla para salir...
pause > nul
