@echo off
color 4F
echo ===============================================================================
echo [ ATENCION: MODO DE RESTAURACION DE EMERGENCIA ]
echo ===============================================================================
echo.
echo ESTE SCRIPT BORRARA TODOS LOS CAMBIOS (NUEVOS, BORRADOS, O MODIFICADOS)
echo Y OBLIGARA AL CODIGO A REGRESAR EXACTAMENTE A COMO ESTABA EN EL CHECKPOINT.
echo.
echo Si el profesor borro algo importante o todo se descompuso, presiona ENTER.
echo Si abriste esto por error, CIERRA LA VENTANA AHORA MISMO.
echo.
pause

echo.
echo Restaurando el codigo al checkpoint de seguridad...
cd /d "%~dp0.."
git reset --hard PUNTO_SEGURO

echo.
echo Eliminando archivos basura creados accidentalmente...
git clean -fd -e porsiacaso/

echo.
echo ===============================================================================
echo [ CODIGO RESTAURADO CON EXITO ]
echo ===============================================================================
echo El proyecto ha vuelto a la vida. Ya puedes cerrar esta ventana.
pause
