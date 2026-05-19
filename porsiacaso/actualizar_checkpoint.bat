@echo off
color 2F
echo ===============================================================================
echo [ ACTUALIZAR CHECKPOINT DE SEGURIDAD ]
echo ===============================================================================
echo.
echo ESTE SCRIPT CREARA UN NUEVO PUNTO DE GUARDADO (CHECKPOINT).
echo A partir de ahora, el boton de restauracion regresara el codigo
echo a COMO ESTA EXACTAMENTE EN ESTE MOMENTO.
echo.
echo Asegurate de haber guardado todos tus archivos en tu editor de codigo
echo y de haber hecho tu 'git commit' antes de continuar.
echo.
pause

echo.
echo Actualizando la etiqueta PUNTO_SEGURO al codigo actual...
cd /d "%~dp0.."
git tag -f PUNTO_SEGURO HEAD

echo.
echo ===============================================================================
echo [ CHECKPOINT ACTUALIZADO CON EXITO ]
echo ===============================================================================
echo Tu nuevo punto de restauracion esta listo.
pause
