// Importamos react-native-reanimated
// Esta librería se usa para manejar animaciones super geniales que encontré en la documentación de React Native
// En proyectos con Expo Router y React Native Reanimated, normalmente se importa en el layout principal
// No se importa algo específico porque solo necesitamos que la librería se inicialice correctamente
import 'react-native-reanimated';

// Importamos Stack desde expo-router
// Stack permite definir una navegación tipo pila
// En una navegación tipo pila, las pantallas se van "apilando" una encima de otra
// Por ejemplo: si vas de Login a Home, Home queda encima de Login en la navegación
import { Stack } from 'expo-router';

// Importamos AuthProvider desde el contexto de autenticación
// AuthProvider sirve para envolver la aplicación y compartir datos de autenticación
import { AuthProvider } from '../context/AuthContext';
import { GlobalAlert } from '../components/GlobalAlert';

// Exportamos el componente RootLayout
// Este componente es el layout raíz de la aplicación
// En Expo Router, el archivo _layout normalmente define la estructura base de navegación para las pantallas que están dentro de esa carpeta
export default function RootLayout() {
  // Retornamos la estructura principal de la app
  return (
    // AuthProvider envuelve toda la navegación
    // Esto significa que todas las pantallas dentro del Stack podrán acceder al contexto de autenticación definido en AuthContext
    <AuthProvider>
      {/* Stack define el sistema de navegación principal de la app. */}
      {/* screenOptions permite configurar opciones generales para todas las pantallas del Stack */}
      {/* headerShown: false oculta el encabezado automático que Expo Router muestra por defecto */}
      {/* Esto es útil cuando queremos diseñar nuestros propios headers o pantallas completas */}
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalAlert />
    </AuthProvider>
  );
}