import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useAdminClientes } from '../../hooks/AdminHooks/useAdminClientes';
import { styles } from '../_styles/AdminStyles';

export default function AdminClientes() {
    useRequireRole('admin');

    const {
        clientes,
        clienteSeleccionado,
        usuario,
        setUsuario,
        cedula,
        setCedula,
        nombre,
        setNombre,
        apellido,
        setApellido,
        telefono,
        setTelefono,
        correo,
        setCorreo,
        password,
        setPassword,
        estado,
        setEstado,
        loadingData,
        loadingAction,
        cargarClientes,
        seleccionarCliente,
        limpiarFormulario,
        guardarCliente,
        cambiarEstadoCliente,
    } = useAdminClientes();

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando clientes...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarClientes}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de clientes</Text>
                <Text style={styles.subtitle}>
                    Crea clientes nuevos, edita información, actívalos o inactívalos.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Clientes registrados</Text>
                    <Text style={styles.cardMuted}>{clientes.length}</Text>
                </View>

                {clientes.length === 0 ? (
                    <Text style={styles.emptyText}>No hay clientes registrados.</Text>
                ) : (
                    clientes.map((cliente) => (
                        <TouchableOpacity
                            key={cliente.id}
                            style={styles.listItem}
                            onPress={() => seleccionarCliente(cliente)}
                            activeOpacity={0.85}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.listTitle}>{cliente.usuario || 'Sin usuario'}</Text>
                                <Text style={styles.listText}>
                                    {cliente.nombre || 'Sin nombre'} {cliente.apellido || ''}
                                </Text>
                                <Text style={styles.listText}>{cliente.correo || 'Sin correo'}</Text>
                            </View>

                            <View style={styles.listActions}>
                                <Text
                                    style={[
                                        styles.statusBadge,
                                        cliente.estado === 'activo'
                                            ? styles.statusActivo
                                            : styles.statusInactivo,
                                    ]}
                                >
                                    {cliente.estado}
                                </Text>
                                <Text style={styles.editText}>Editar</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{clienteSeleccionado ? 'Editar cliente' : 'Crear nuevo cliente'}</Text>
                    {(usuario || nombre || correo) ? (
                        <TouchableOpacity onPress={limpiarFormulario}>
                            <Text style={styles.clearText}>Cancelar</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <Text style={styles.label}>Usuario</Text>
                <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Usuario" placeholderTextColor="#6B7280" />

                <Text style={styles.label}>Cédula</Text>
                <TextInput style={styles.input} value={cedula} onChangeText={setCedula} placeholder="Cédula" placeholderTextColor="#6B7280" keyboardType="number-pad" />

                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#6B7280" />

                <Text style={styles.label}>Apellido</Text>
                <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Apellido" placeholderTextColor="#6B7280" />

                <Text style={styles.label}>Teléfono</Text>
                <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

                <Text style={styles.label}>Correo</Text>
                <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="Correo" placeholderTextColor="#6B7280" keyboardType="email-address" autoCapitalize="none" />

                {!clienteSeleccionado && (
                    <>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#6B7280" secureTextEntry />
                    </>
                )}

                <Text style={styles.label}>Estado</Text>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.optionButton, estado === 'activo' && styles.optionButtonActive]}
                        onPress={() => setEstado('activo')}
                    >
                        <Text style={[styles.optionText, estado === 'activo' && styles.optionTextActive]}>
                            Activo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionButton, estado === 'inactivo' && styles.optionButtonActive]}
                        onPress={() => setEstado('inactivo')}
                    >
                        <Text style={[styles.optionText, estado === 'inactivo' && styles.optionTextActive]}>
                            Inactivo
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                    onPress={guardarCliente}
                    disabled={loadingAction}
                >
                    {loadingAction ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>{clienteSeleccionado ? 'Guardar cambios' : 'Crear cliente'}</Text>
                    )}
                </TouchableOpacity>

                {clienteSeleccionado && (
                    <TouchableOpacity
                        style={styles.secondaryButtonFull}
                        onPress={() =>
                            cambiarEstadoCliente(
                                clienteSeleccionado.id,
                                clienteSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                            )
                        }
                        disabled={loadingAction}
                    >
                        <Text style={styles.secondaryButtonFullText}>
                            {clienteSeleccionado.estado === 'activo' ? 'Inactivar cliente' : 'Activar cliente'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
