@echo off
:: SECCION
:: Este archivo por lotes interactivo sirve para iniciar el proceso de descifrado del codigo fuente del proyecto (restaurando todas las carpetas y archivos en claro usando Node)

:: Desactiva la impresion en consola de los comandos que se ejecutan (para mantener limpia la terminal)
@echo off
:: Establece el titulo de la ventana de la consola (para identificar de que se trata el proceso)
title Desbloquear Proyecto - Q Ruta
:: Limpia toda la pantalla de la consola (removiendo cualquier texto anterior que haya quedado en la sesion)
cls
:: Cambia el color de la terminal a azul cian claro con fondo negro (para darle un estilo visual retro y agradable)
color 0B
:: Imprime una linea en blanco en la terminal (dando aire visual a la consola)
echo.
echo     DESBLOQUEAR ENTORNO DE DESARROLLO - Q RUTA
echo.
:: Muestra al desarrollador un mensaje indicando que el codigo fuente esta actualmente seguro y encriptado
echo   [SISTEMA PROTEGIDO] El codigo fuente esta cifrado con AES-256-CBC.
echo.
:: Solicita al usuario ingresar su clave de seguridad por teclado y la guarda en la variable KEY (el parametro /p indica entrada de usuario)
set /p KEY="  [CLAVE] Ingresa la clave de seguridad: "
echo.

:: Compara si la variable KEY esta vacia (por si el usuario solo presiono Enter sin escribir nada) y de ser asi salta a la etiqueta EMPTY_KEY
if "%KEY%"=="" goto EMPTY_KEY

:: Imprime un mensaje indicando que se ha iniciado el proceso de descifrado de los archivos
echo   [PROCESANDO] Descifrando archivos...
:: Ejecuta el motor Node.js pasandole la ruta del script de descifrado y la clave escrita por el usuario entre comillas (para evitar problemas con espacios)
node scripts\crypt-env.js decrypt "%KEY%"

:: Guarda el codigo de salida que retorno el proceso anterior de Node.js en la variable EXIT_CODE (para saber si el descifrado fue exitoso o fallo)
set EXIT_CODE=%ERRORLEVEL%
echo.

:: Compara el codigo de salida y si es 0 (indica exito absoluto) salta a la etiqueta SUCCESS
if %EXIT_CODE% equ 0 goto SUCCESS
:: Compara el codigo de salida y si es 2 (indica que la clave de seguridad es incorrecta) salta a la etiqueta WRONG_KEY
if %EXIT_CODE% equ 2 goto WRONG_KEY
:: Si es cualquier otro codigo (indica que no hay Node instalado o fallo inesperado) salta por defecto a la etiqueta GENERIC_ERROR
goto GENERIC_ERROR

:: Define el bloque de codigo en caso de que la clave ingresada este totalmente vacia
:EMPTY_KEY
:: Cambia el color de la consola a rojo brillante con fondo negro (para alertar al usuario del error)
color 0C
:: Muestra un mensaje detallado explicando que la contraseña no puede dejarse en blanco
echo   [ERROR] La clave no puede estar vacia.
echo.
:: Pide al usuario presionar una tecla cualquiera para cerrar el script
echo   Presiona cualquier tecla para salir...
:: Pausa la ejecucion del script esperando que el usuario presione una tecla (ocultando el mensaje nativo con > nul)
pause > nul
:: Finaliza el archivo bat saliendo del proceso
exit /b

:: Define el bloque de codigo en caso de que el descifrado haya sido exitoso
:SUCCESS
:: Cambia el color de la consola a verde brillante con fondo negro (para denotar exito)
color 0A
:: Muestra una caja decorativa felicitando al usuario por el desbloqueo exitoso de sus archivos

echo     ¡DESBLOQUEO EXITOSO! Carpetas restauradas con exito.

:: Informa que el entorno de desarrollo esta listo y que ya se puede programar en VS Code o iniciar Expo Router
echo   Ahora puedes abrir VS Code o ejecutar "npm run start".
:: Salta a la etiqueta END para finalizar el flujo del programa
goto END

:: Define el bloque de codigo en caso de que la contraseña ingresada no sea la correcta
:WRONG_KEY
:: Cambia el color de la consola a rojo brillante con fondo negro (para alertar del fallo de seguridad)
color 0C
:: Muestra un mensaje informando que la clave es incorrecta y que los archivos siguen encriptados
echo   [ERROR] Ponte pilas que esa no es la clave.
echo   El codigo fuente permanece protegido y cifrado.
:: Salta a la etiqueta END para finalizar
goto END

:: Define el bloque de codigo en caso de que ocurra un error no controlado en el sistema
:GENERIC_ERROR
:: Cambia el color de la consola a amarillo brillante con fondo negro (para indicar advertencia del sistema)
color 0E
:: Informa al usuario que ocurrio un fallo inesperado (generalmente la falta del motor de ejecucion Node.js)
echo   [ERROR DEL SISTEMA] Ocurrio un fallo inesperado.
echo   Asegurate de tener Node.js instalado.
:: Salta a la etiqueta END para finalizar
goto END

:: Define el bloque final donde concluye la ejecucion del script
:END
echo.
:: Invita al usuario a presionar una tecla para cerrar la ventana negra de la terminal
echo   Presiona cualquier tecla para salir...
:: Pausa la consola para que el usuario pueda leer los resultados en pantalla antes de que se cierre sola
pause > nul

::ANÁLISIS DE PROBLEMAS SI SE QUITAN LAS FUNCIONES:
::"si quitas la comparacion if "%KEY%"=="" goto EMPTY_KEY pasa que el script intentara ejecutar Node con una clave vacia lo cual provocara un error de argumento en crypt-env.js y cerrara el programa abruptamente"
::"si quitas la ejecucion de node scripts\crypt-env.js decrypt "%KEY%" pasa que nunca se invocara el motor de descifrado y las carpetas de codigo jamas se restauraran en tu disco duro (quedando el proyecto inservible en su estado encriptado)"
::"si quitas la comprobacion de EXIT_CODE pasa que el script siempre dira que fue exitoso o mostrara pantallas equivocadas incluso si la clave ingresada era incorrecta (confundiendo al desarrollador)"
::"si quitas las etiquetas :SUCCESS :WRONG_KEY o :GENERIC_ERROR pasa que el archivo por lotes de Windows no sabra a donde saltar y lanzara un error de sintaxis del sistema de archivos .bat deteniendo la ejecucion"
::"si quitas la pausa pause > nul del final pasa que la consola de comandos se cerrara instantaneamente en una fraccion de segundo despues de procesar y el desarrollador no podra ver si el descifrado tuvo exito o fallo"
