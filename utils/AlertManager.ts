// (ESTE ARCHIVO ES EL SISTEMA DE ALERTAS PERSONALIZADO QUE REEMPLAZA LOS POPUPS FEO DEL SISTEMA POR MODALES BONITOS Y COHERENTES CON EL DISEÑO DE TODA LA APP)

// (Define cómo luce un botón dentro de un modal de alerta)
export type AlertButton = {
    // (El texto que se verá en el botón)
    text: string
    // (La función que se ejecuta cuando el usuario le toca)
    onPress?: () => void
    // (El estilo visual del botón para diferenciarlo visualmente)
    style?: 'default' | 'cancel' | 'destructive'
}

// (Define la estructura completa de una alerta incluyendo su título y sus botones)
export type AlertOptions = {
    // (El título en negrita que aparece arriba del modal)
    title: string
    // (El texto explicativo opcional que aparece debajo del título)
    message?: string
    // (Los botones de acción que puede tener el modal)
    buttons?: AlertButton[]
}

// (Esta clase es el puente entre cualquier parte del código y el componente visual de la alerta)
class AlertManager {
    // (Guardamos aquí la función del componente visual que sabe cómo dibujar el modal)
    private listener: ((options: AlertOptions) => void) | null = null

    // (Registramos al componente de la UI para que sepa que existe y a quién llamar)
    setListener(listener: (options: AlertOptions) => void) {
        this.listener = listener
    }

    // (Función principal que cualquier hook o servicio puede llamar para mostrar una alerta)
    alert(title: string, message?: string, buttons?: AlertButton[]) {
        // (Si el componente visual ya está montado en pantalla le pasamos la alerta directamente)
        if (this.listener) {
            this.listener({ title, message, buttons })
        } else {
            // (Si el componente aún no se montó usamos el Alert nativo de React Native como plan B)
            // (Esto puede pasar en errores muy tempranos antes de que la app termine de cargar)
            import('react-native').then(({ Alert }) => {
                Alert.alert(title, message, buttons)
            })
        }
    }
}

// (Creamos una sola instancia de AlertManager que se comparte en toda la app)
// (Esto se llama patrón singleton y garantiza que solo haya un sistema de alertas activo)
export const CustomAlert = new AlertManager()

/*
Problemas que se pueden generar si quitan funciones:
(si quitas setListener el componente de la UI nunca se conectará al manager y todas las alertas irán a la alerta nativa fea del sistema)
(si quitas alert ningún hook ni servicio podrá mostrar mensajes de error al usuario y los problemas ocurrirán en silencio)
(si borras este archivo toda la app dejará de funcionar porque cada hook importa CustomAlert para reportar errores)
*/
