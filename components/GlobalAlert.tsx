// Importamos React junto con useEffect (para ejecutar código al montar el componente) y useState (para manejar el estado local del modal)
import React, { useEffect, useState } from 'react';

// Importamos los componentes nativos de React Native que necesitamos para construir el modal:
// Modal (la ventana flotante), View (contenedor genérico), Text (texto),
// TouchableOpacity (botón con efecto de opacidad al presionar) y ActivityIndicator (spinner de carga, aunque no se usa visualmente aquí pero se importa por si se extiende)
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

// Importamos el paquete de íconos de Expo para mostrar íconos visuales dentro del modal
// (círculo de error, checkmark de éxito, etc.)
import { Ionicons } from '@expo/vector-icons';

// Importamos CustomAlert (el objeto singleton que actúa como puente global para disparar el modal desde cualquier parte del código)
// y AlertOptions (el tipo TypeScript que describe la estructura de datos que recibe el modal: título, mensaje, botones, etc.)
import { CustomAlert, AlertOptions } from '../utils/AlertManager';

// Importamos los estilos del modal desde su archivo dedicado para mantener el componente limpio y separado de la presentación visual
import { styles } from '../app/_styles/GlobalAlertStyles';

// Este archivo es el componente visual del sistema de alertas globales de la app
// Es un modal reutilizable que puede ser disparado desde cualquier parte de la aplicación
// sin necesidad de importar componentes de UI en cada pantalla
// Recibe configuración dinámica (título, mensaje, botones) a través del sistema AlertManager
// y se encarga de elegir automáticamente el ícono y los colores según el tipo de alerta detectado en el título

// Función principal del componente (es un componente funcional de React que no recibe props externas,
// ya que toda su configuración llega a través del AlertManager)
export function GlobalAlert() {

    // Estado que controla si el modal está visible o no en pantalla
    const [visible, setVisible] = useState(false);

    // Estado que guarda la configuración completa de la alerta actual
    // (puede ser null si todavía no se ha disparado ninguna alerta)
    const [config, setConfig] = useState<AlertOptions | null>(null);

    // useEffect sin dependencias (el array vacío [] significa que solo se ejecuta una vez al montar el componente)
    // Aquí registramos el "listener" o escuchador global del AlertManager
    // para que cada vez que alguien llame a CustomAlert.show() desde cualquier pantalla,
    // este componente reciba la configuración y se muestre
    useEffect(() => {
        // Le decimos al CustomAlert quién debe escucharlo
        // (le pasamos una función callback que actualiza el config y hace visible el modal)
        CustomAlert.setListener((options) => {
            // Guardamos la configuración de la nueva alerta que llegó
            setConfig(options);
            // Hacemos visible el modal para que aparezca en pantalla
            setVisible(true);
        });
    }, []);

    // Si el modal no está visible o no hay configuración cargada, no renderizamos nada
    // (esto evita que haya un modal vacío flotando en el árbol de componentes)
    if (!visible || !config) return null;

    // Si la alerta fue disparada sin botones definidos, creamos uno por defecto de "OK"
    // para que el usuario siempre tenga forma de cerrar el modal sin quedarse atrapado
    const buttons = config.buttons && config.buttons.length > 0
        ? config.buttons                                        // usamos los botones que mandaron
        : [{ text: 'OK', style: 'default' as const }];         // o el fallback de OK si no mandaron nada

    // Convertimos el título a minúsculas para poder hacer comparaciones de texto sin importar mayúsculas
    // (esto es una heurística simple para detectar el tipo de alerta según palabras clave)
    const titleLower = config.title.toLowerCase();

    // Valores por defecto del ícono (asumimos advertencia/warning como estado inicial)
    let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
    let iconStyle = styles.iconContainerWarning;
    let iconColor = '#F59E0B'; // amarillo de advertencia

    // Revisamos si el título contiene palabras que indican error o problema
    // (si encuentra alguna de estas palabras, cambia el ícono y color a rojo de error)
    if (titleLower.includes('error') || titleLower.includes('falló') || titleLower.includes('inválido') || titleLower.includes('vencido') || titleLower.includes('denegado')) {
        iconName = 'close-circle';                      // ícono de X (error)
        iconStyle = styles.iconContainerError;          // estilo del contenedor en rojo
        iconColor = '#EF4444';                          // rojo

        // Si el título contiene palabras que indican éxito, cambiamos a verde
    } else if (titleLower.includes('éxito') || titleLower.includes('aprobado') || titleLower.includes('completado') || titleLower.includes('generada')) {
        iconName = 'checkmark-circle';                  // ícono de checkmark (éxito)
        iconStyle = styles.iconContainerSuccess;        // estilo del contenedor en verde
        iconColor = '#00E676';                          // verde
    }

    // Función que se ejecuta cuando el usuario presiona cualquier botón del modal
    // Recibe opcionalmente una función onPress del botón (puede ser async si necesita esperar algo)
    const handlePress = async (onPress?: () => void | Promise<void>) => {
        // Primero ocultamos el modal inmediatamente para que la UI responda rápido
        setVisible(false);

        // Esperamos 150ms antes de ejecutar el callback del botón
        // para que la animación de cierre del modal alcance a verse antes de que empiece otra acción
        setTimeout(async () => {
            if (onPress) {
                // Ejecutamos el callback del botón (puede ser async, por eso usamos await)
                await onPress();
            }
        }, 150);
    };

    // Determinamos si los botones deben ir en fila horizontal (row) o en columna vertical
    // Usamos row solo si hay 2 botones o menos Y ninguno tiene texto demasiado largo (más de 14 caracteres)
    // Esto evita que los botones con texto largo queden aplastados cuando están en fila
    const useRow = buttons.length <= 2 && !buttons.some(b => b.text.length > 14);

    // Renderizamos el modal con toda la estructura visual
    return (
        // Modal nativo de React Native que flota sobre toda la pantalla
        // transparent: el fondo del modal es transparente (el overlay oscuro lo hacemos nosotros con estilos)
        // animationType="fade": aparece y desaparece con una animación de fundido suave
        // visible: controlado por el estado local, determina si el modal está activo
        // onRequestClose: en Android, cuando el usuario presiona el botón físico de atrás, cerramos el modal
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={() => setVisible(false)}
        >
            {/* Capa semi-transparente oscura que cubre toda la pantalla detrás del card */}
            <View style={styles.overlay}>

                {/* Card blanca (o del tema) que contiene todo el contenido del modal */}
                <View style={styles.card}>

                    {/* Contenedor del ícono, combinamos el estilo base con el estilo dinámico según el tipo de alerta */}
                    <View style={[styles.iconContainer, iconStyle]}>
                        {/* Ícono dinámico que cambia según si es error, éxito o advertencia */}
                        <Ionicons name={iconName} size={36} color={iconColor} />
                    </View>

                    {/* Título de la alerta, viene directamente de la configuración que mandó quien disparó el modal */}
                    <Text style={styles.title}>{config.title}</Text>

                    {/* El mensaje es opcional, solo lo renderizamos si viene definido en la configuración */}
                    {config.message ? (
                        <Text style={styles.message}>{config.message}</Text>
                    ) : null}

                    {/* Contenedor de botones, aplica estilos de fila o columna según lo que calculamos arriba */}
                    <View style={[
                        styles.buttonsContainer,
                        useRow ? styles.buttonsRow : null
                    ]}>
                        {/* Recorremos el array de botones y renderizamos uno por cada elemento */}
                        {buttons.map((btn, index) => {
                            // Estilos por defecto del botón (se sobrescriben según el "style" del botón)
                            let btnStyle: any = styles.buttonDefault;
                            let txtStyle: any = styles.buttonTextDefault;

                            // Si el botón es de tipo "cancel" (cancelar), aplicamos estilos de cancelación
                            if (btn.style === 'cancel') {
                                btnStyle = styles.buttonCancel;
                                txtStyle = styles.buttonTextCancel;

                                // Si es "destructive" (acción peligrosa como eliminar), aplicamos estilo rojo/destructivo
                            } else if (btn.style === 'destructive') {
                                btnStyle = styles.buttonDestructive;
                                txtStyle = styles.buttonTextDestructive;
                            }

                            return (
                                // Botón presionable con efecto de opacidad al tocarlo
                                // key={index}: usamos el índice como clave única (es aceptable porque los botones no se reordenan)
                                // style combinado: estilos base + ancho dinámico (flex:1 en fila, 100% en columna) + estilo del tipo de botón
                                // activeOpacity: el botón se ve al 80% de opacidad cuando lo presionan
                                // onPress: llama a handlePress pasando el callback del botón (puede ser undefined si no tiene acción)
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.button, useRow ? { flex: 1 } : { width: '100%' }, btnStyle]}
                                    activeOpacity={0.8}
                                    onPress={() => handlePress(btn.onPress)}
                                >
                                    {/* Texto del botón con estilos base + estilo del tipo de botón */}
                                    <Text style={[styles.buttonText, txtStyle]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </View>
            </View>
        </Modal>
    );
}

// IMPACTO DE ELIMINAR PARTES DE ESTE COMPONENTE
//
// Si quitamos el useEffect con el CustomAlert.setListener, el modal nunca sabrá cuándo debe mostrarse,
// así que ninguna alerta global funcionará en toda la app aunque el AlertManager siga existiendo
//
// Si quitas la lógica de buttons con el fallback de "OK", los modales disparados sin botones definidos
// quedarán sin botones visibles y el usuario no tendrá forma de cerrarlos (quedará atrapado en el modal)
//
// Si quitas el bloque de detección del ícono (el if/else if sobre titleLower), todos los modales
// mostrarán siempre el ícono amarillo de advertencia sin importar si es un error o un éxito,
// perdiendo el feedback visual que orienta al usuario
//
// Si quitas la función handlePress y pones setVisible(false) directamente en el onPress,
// el callback del botón se ejecutará antes de que el modal termine de cerrarse,
// lo que puede causar conflictos de UI si ese callback abre otro modal o navega a otra pantalla
//
// Si quitas useRow y fijas siempre un layout de columna, los botones cortos (como "OK / Cancelar")
// quedarán estirados verticalmente ocupando más espacio del necesario y el modal se verá más grande de lo que debería
//
// Si quitas el onRequestClose del Modal, en Android el botón físico de atrás no cerrará el modal
// y el usuario tampoco quedará atrapado pero tendrá una experiencia inconsistente con el resto del sistema
