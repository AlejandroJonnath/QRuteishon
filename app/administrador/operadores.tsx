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
import { useAdminOperadores } from '../../hooks/AdminHooks/useAdminOperadores';
import { styles } from '../_styles/AdminStyles';

export default function AdminOperadores() {
    useRequireRole('admin');

    const [modalGasolineraVisible, setModalGasolineraVisible] = useState(false);
    const [modalFormVisible, setModalFormVisible] = useState(false);

    const {
        operadores,
        gasolineras,
        operadorSeleccionado,
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
        gasolineraId,
        setGasolineraId,
        estado,
        setEstado,
        loadingData,
        loadingAction,
        cargarOperadores,
        seleccionarOperador,
        limpiarFormulario,
        guardarOperador,
        cambiarEstadoOperador,
    } = useAdminOperadores();

    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 5;

    const totalPaginas = Math.ceil(operadores.length / registrosPorPagina) || 1;
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;
    const operadoresPaginados = operadores.slice(indicePrimero, indiceUltimo);

    function abrirFormularioNuevo() {
        limpiarFormulario();
        setModalFormVisible(true);
    }

    function abrirFormularioEditar(operador: Parameters<typeof seleccionarOperador>[0]) {
        seleccionarOperador(operador);
        setModalFormVisible(true);
    }

    function cerrarModal() {
        limpiarFormulario();
        setModalFormVisible(false);
    }

    async function guardarYCerrar() {
        await guardarOperador();
        setModalFormVisible(false);
    }

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando operadores...</Text>
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
                    onRefresh={cargarOperadores}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de operadores</Text>
                <Text style={styles.subtitle}>
                    Crea nuevos despachadores, asígnales una gasolinera o edita sus datos.
                </Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={abrirFormularioNuevo}>
                <Text style={styles.createButtonText}>+ Crear operador</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Operadores registrados</Text>
                    <Text style={styles.cardMuted}>{operadores.length}</Text>
                </View>

                {operadores.length === 0 ? (
                    <Text style={styles.emptyText}>No hay operadores registrados.</Text>
                ) : (
                    <>
                        {operadoresPaginados.map((operador) => (
                            <TouchableOpacity
                                key={operador.id}
                                style={styles.listItem}
                                onPress={() => abrirFormularioEditar(operador)}
                                activeOpacity={0.85}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>{operador.usuario || 'Sin usuario'}</Text>
                                    <Text style={styles.listText}>
                                        {operador.nombre || 'Sin nombre'} {operador.apellido || ''}
                                    </Text>
                                    <Text style={styles.listText}>{operador.correo || 'Sin correo'}</Text>
                                </View>

                                <View style={styles.listActions}>
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            operador.estado === 'activo'
                                                ? styles.statusActivo
                                                : styles.statusInactivo,
                                        ]}
                                    >
                                        {operador.estado}
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
                                    {operadorSeleccionado ? 'Editar operador' : 'Crear operador'}
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

                                <Text style={styles.label}>Gasolinera (Obligatorio)</Text>
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }]}
                                    onPress={() => setModalGasolineraVisible(true)}
                                >
                                    <Text style={{ color: gasolineraId ? '#FFFFFF' : '#6B7280' }}>
                                        {gasolineras.find(g => g.id === gasolineraId)?.nombre || "Seleccionar Gasolinera"}
                                    </Text>
                                </TouchableOpacity>

                                {!operadorSeleccionado && (
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
                                        <Text style={styles.buttonText}>{operadorSeleccionado ? 'Guardar cambios' : 'Crear operador'}</Text>
                                    )}
                                </TouchableOpacity>

                                {operadorSeleccionado && (
                                    <TouchableOpacity
                                        style={styles.secondaryButtonFull}
                                        onPress={() =>
                                            cambiarEstadoOperador(
                                                operadorSeleccionado.id,
                                                operadorSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                                            )
                                        }
                                        disabled={loadingAction}
                                    >
                                        <Text style={styles.secondaryButtonFullText}>
                                            {operadorSeleccionado.estado === 'activo' ? 'Inactivar operador' : 'Activar operador'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal selector de gasolinera */}
            <Modal
                visible={modalGasolineraVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalGasolineraVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalGasolineraVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecciona una Gasolinera</Text>
                        <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                            {gasolineras.map(g => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setGasolineraId(g.id);
                                        setModalGasolineraVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{g.nombre}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalGasolineraVisible(false)}>
                            <Text style={styles.modalCloseText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}
