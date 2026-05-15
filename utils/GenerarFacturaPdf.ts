import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { CustomAlert } from '../utils/AlertManager'

// (ESTE ARCHIVO GENERA UN DOCUMENTO PDF CON EL COMPROBANTE DE PAGO DEL CLIENTE Y LO COMPARTE POR WHATSAPP EMAIL O LO QUE EL USUARIO ELIJA DESDE SU CELULAR)

// (La función principal que construye el HTML del comprobante y lo convierte a PDF)
export async function generarYCompartirFacturaCliente(pago: any) {
    try {
        // (Formateamos los números a dos decimales para que se vean bien en el documento)
        const total = Number(pago.total || 0).toFixed(2)
        const subtotal = Number(pago.valor || 0).toFixed(2)
        const descuento = Number(pago.descuento || 0).toFixed(2)

        // (Construimos la fecha legible en español con hora incluida para el comprobante)
        const fecha = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        // (Construimos el HTML completo del comprobante usando plantilla de texto multilinea)
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Factura de Pago - QRuteishon</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background-color: #f9fafb;
                    color: #111827;
                    padding: 40px;
                    margin: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background-color: #0B132B;
                    color: #00E676;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    letter-spacing: 1px;
                }
                .header p {
                    margin: 5px 0 0 0;
                    color: #9CA3AF;
                    font-size: 14px;
                }
                .content {
                    padding: 30px;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #374151;
                    border-bottom: 2px solid #E5E7EB;
                    padding-bottom: 5px;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 15px;
                }
                .row.bold {
                    font-weight: 700;
                    font-size: 18px;
                    margin-top: 20px;
                    border-top: 2px solid #E5E7EB;
                    padding-top: 15px;
                }
                .text-green {
                    color: #0B132B;
                }
                .footer {
                    background-color: #F3F4F6;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #6B7280;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Q-Ruta</h1>
                    <p>Recibo de Pago Electrónico</p>
                </div>
                <div class="content">
                    <div class="section-title">Detalles de la Transacción</div>
                    
                    <div class="row">
                        <span>Fecha y Hora:</span>
                        <span>${fecha}</span>
                    </div>
                    <div class="row">
                        <span>Tipo de Gasolina:</span>
                        <span>${pago.tipo_gasolina || 'No especificado'}</span>
                    </div>
                    <div class="row">
                        <span>Método de Pago:</span>
                        <span style="text-transform: capitalize;">${(pago.metodo_pago || 'Desconocido').replace('_', ' ')}</span>
                    </div>
                    <div class="row">
                        <span>Estado:</span>
                        <span style="text-transform: capitalize; color: #10B981; font-weight: bold;">Aprobado</span>
                    </div>

                    <div style="margin-top: 30px;"></div>
                    <div class="section-title">Resumen de Cobro</div>
                    
                    <div class="row">
                        <span>Subtotal:</span>
                        <span>$${subtotal}</span>
                    </div>
                    <div class="row">
                        <span>Descuento:</span>
                        <span style="color: #EF4444;">-$${descuento}</span>
                    </div>
                    
                    <div class="row bold">
                        <span>TOTAL PAGADO:</span>
                        <span class="text-green">$${total}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Gracias por preferir Q-Ruta</p>
                    <p>Este documento es un comprobante de pago generado electrónicamente</p>
                </div>
            </div>
        </body>
        </html>
        `

        // (En la web no podemos guardar archivos nativamente ni usar Share así que usamos el diálogo de impresión del navegador)
        if (Platform.OS === 'web') {
            // (El diálogo de impresión del navegador tiene la opción de Guardar como PDF de manera nativa)
            await Print.printAsync({ html })
            return
        }

        // (En iOS y Android convertimos el HTML a un archivo PDF real usando expo-print)
        const { uri } = await Print.printToFileAsync({
            html,
            // (base64 en false para obtener una URI de archivo real que se pueda compartir)
            base64: false
        })

        // (Verificamos si el dispositivo puede compartir archivos antes de intentarlo)
        const canShare = await Sharing.isAvailableAsync()

        // (Si puede compartir abrimos el selector de apps como WhatsApp Gmail etc)
        if (canShare) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Descargar o compartir comprobante',
                // (UTI es el identificador que usa iOS para reconocer que es un PDF)
                UTI: 'com.adobe.pdf'
            })
        } else {
            // (Si el dispositivo no puede compartir archivos avisamos)
            CustomAlert.alert('Error', 'No es posible compartir o guardar archivos en este dispositivo')
        }

    } catch (error) {
        // (Si algo falla durante la generación del PDF atrapamos el error)
        console.log('Error generando PDF:', error)
        CustomAlert.alert('Error', 'No se pudo generar el documento PDF')
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas generarYCompartirFacturaCliente el botón de Descargar Factura que aparece después de pagar no hará absolutamente nada)
(si quitas la lógica de Platform.OS el código intentará usar Share en la web y dará error porque el navegador no soporta esa API nativa)
*/
