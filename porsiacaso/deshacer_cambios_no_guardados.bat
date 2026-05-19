@echo off
color 1F
echo ===============================================================================
echo [ LIMPIEZA RAPIDA: DESHACER CAMBIOS NO GUARDADOS ]
echo ===============================================================================
echo.
echo Esto no afecta el historial de Git, pero eliminara cualquier modificacion
echo que hayas hecho en los archivos en los ultimos minutos sin guardarla.
echo.
echo Presiona ENTER para limpiar los archivos actuales.
echo.
pause

echo.
echo Limpiando archivos modificados...
cd /d "%~dp0.."
git restore .

echo.
echo Limpiando archivos basura nuevos...
git clean -fd -e porsiacaso/

echo.
echo ===============================================================================
echo [ LIMPIEZA TERMINADA ]
echo ===============================================================================
echo Los cambios temporales fueron deshechos.
pause
