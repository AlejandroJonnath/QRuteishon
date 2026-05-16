import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useAdminAdministradores } from '../../hooks/AdminHooks/useAdminAdministradores';
import { styles } from '../_styles/AdminStyles';

export default function AdminAdministradores() {
    useRequireRole('admin');

    const {
        administradores,
        adminSeleccionado,
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
        cargarAdministradores,
        seleccionarAdmin,
        limpiarFormulario,
        guardarAdministrador,
        cambiarEstadoAdmin,
    } = useAdminAdministradores();

    const [paginaActual, setPaginaActual] = useState(1);
    const [modalFormVisible, setModalFormVisible] = useState(false);
    const registrosPorPagina = 5;

    const totalPaginas = Math.ceil(administradores.length / registrosPorPagina) || 1;
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;
    const administradoresPaginados = administradores.slice(indicePrimero, indiceUltimo);

    function abrirFormularioNuevo() {
        limpiarFormulario();
        setModalFormVisible(true);
    }

    function abrirFormularioEditar(admin: Parameters<typeof seleccionarAdmin>[0]) {
        seleccionarAdmin(admin);
        setModalFormVisible(true);
    }

    function cerrarModal() {
        limpiarFormulario();
        setModalFormVisible(false);
    }

    async function guardarYCerrar() {
        await guardarAdministrador();
        setModalFormVisible(false);
    }

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando administradores...</Text>
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
                    onRefresh={cargarAdministradores}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de Admins</Text>
                <Text style={styles.subtitle}>
                    Añade o revoca accesos de administrador al panel de control principal.
                </Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={abrirFormularioNuevo}>
                <Text style={styles.createButtonText}>+ Crear administrador</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Admins registrados</Text>
                    <Text style={styles.cardMuted}>{administradores.length}</Text>
                </View>

                {administradores.length === 0 ? (
                    <Text style={styles.emptyText}>No hay administradores registrados.</Text>
                ) : (
                    <>
                        {administradoresPaginados.map((admin) => (
                            <TouchableOpacity
                                key={admin.id}
                                style={styles.listItem}
                                onPress={() => abrirFormularioEditar(admin)}
                                activeOpacity={0.85}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>{admin.usuario || 'Sin usuario'}</Text>
                                    <Text style={styles.listText}>
                                        {admin.nombre || 'Sin nombre'} {admin.apellido || ''}
                                    </Text>
                                    <Text style={styles.listText}>{admin.correo || 'Sin correo'}</Text>
                                </View>

                                <View style={styles.listActions}>
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            admin.estado === 'activo'
                                                ? styles.statusActivo
                                                : styles.statusInactivo,
                                        ]}
                                    >
                                        {admin.estado}
                                    </Text>
                                    <Text style={styles.editText}>Editar</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                Página {paginaActual} de {totalPaginas}
                            </Text>

                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === totalPaginas && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>

            {/* Modal del formulario */}
            <Modal
                visible={modalFormVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={cerrarModal}
                    >
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            <View style={styles.formModalHeader}>
                                <Text style={styles.formModalTitle}>
                                    {adminSeleccionado ? 'Editar administrador' : 'Crear administrador'}
                                </Text>
                                <TouchableOpacity onPress={cerrarModal}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
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

                                {!adminSeleccionado && (
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
                                    onPress={guardarYCerrar}
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        <Text style={styles.buttonText}>{adminSeleccionado ? 'Guardar cambios' : 'Crear admin'}</Text>
                                    )}
                                </TouchableOpacity>

                                {adminSeleccionado && (
                                    <TouchableOpacity
                                        style={styles.secondaryButtonFull}
                                        onPress={() =>
                                            cambiarEstadoAdmin(
                                                adminSeleccionado.id,
                                                adminSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                                            )
                                        }
                                        disabled={loadingAction}
                                    >
                                        <Text style={styles.secondaryButtonFullText}>
                                            {adminSeleccionado.estado === 'activo' ? 'Inactivar administrador' : 'Activar administrador'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}
