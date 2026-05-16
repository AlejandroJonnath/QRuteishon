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
import { useAdminCupones } from '../../hooks/AdminHooks/useAdminCupones';
import { styles } from '../_styles/AdminStyles';

export default function AdminCupones() {
    useRequireRole('admin');

    const {
        cupones,
        cantidad,
        setCantidad,
        tipoDescuento,
        setTipoDescuento,
        valorDescuento,
        setValorDescuento,
        diasValidez,
        setDiasValidez,
        loadingData,
        loadingAction,
        cargarCupones,
        generarLoteCupones,
        cambiarEstadoCupon,
    } = useAdminCupones();

    const [paginaActual, setPaginaActual] = useState(1);
    const [modalFormVisible, setModalFormVisible] = useState(false);
    const registrosPorPagina = 5;

    const totalPaginas = Math.ceil(cupones.length / registrosPorPagina) || 1;
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;
    const cuponesPaginados = cupones.slice(indicePrimero, indiceUltimo);

    async function generarYCerrar() {
        await generarLoteCupones();
        setModalFormVisible(false);
    }

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando cupones...</Text>
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
                    onRefresh={cargarCupones}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de Cupones</Text>
                <Text style={styles.subtitle}>
                    Crea múltiples cupones automáticamente y administra los existentes.
                </Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={() => setModalFormVisible(true)}>
                <Text style={styles.createButtonText}>+ Generar lote de cupones</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Cupones Globales</Text>
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>No hay cupones registrados.</Text>
                ) : (
                    <>
                        {cuponesPaginados.map((cupon) => (
                            <View key={cupon.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>{cupon.codigo}</Text>
                                    <Text style={styles.listText}>
                                        Descuento: {cupon.tipo_descuento === 'monto' ? '$' : ''}{cupon.valor_descuento}{cupon.tipo_descuento === 'porcentaje' ? '%' : ''}
                                    </Text>
                                    <Text style={styles.listText}>Uso único: {cupon.uso_unico ? 'Sí' : 'No'}</Text>
                                </View>

                                <View style={styles.listActions}>
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            cupon.estado === 'disponible' ? styles.statusActivo : styles.statusInactivo,
                                        ]}
                                    >
                                        {cupon.estado}
                                    </Text>

                                    {cupon.estado === 'disponible' && (
                                        <TouchableOpacity
                                            onPress={() => cambiarEstadoCupon(cupon.id, 'vencido')}
                                            disabled={loadingAction}
                                        >
                                            <Text style={[styles.editText, { color: '#EF4444' }]}>Anular</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
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

            {/* Modal del generador de cupones */}
            <Modal
                visible={modalFormVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalFormVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={() => setModalFormVisible(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            <View style={styles.formModalHeader}>
                                <Text style={styles.formModalTitle}>Generador Automático</Text>
                                <TouchableOpacity onPress={() => setModalFormVisible(false)}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
                                <Text style={styles.label}>Cantidad a generar (Ej: 10)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cantidad}
                                    onChangeText={setCantidad}
                                    placeholder="Número de cupones"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="number-pad"
                                />

                                <Text style={styles.label}>Tipo de Descuento</Text>
                                <View style={styles.row}>
                                    <TouchableOpacity
                                        style={[styles.optionButton, tipoDescuento === 'monto' && styles.optionButtonActive]}
                                        onPress={() => setTipoDescuento('monto')}
                                    >
                                        <Text style={[styles.optionText, tipoDescuento === 'monto' && styles.optionTextActive]}>
                                            Monto Fijo ($)
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.optionButton, tipoDescuento === 'porcentaje' && styles.optionButtonActive]}
                                        onPress={() => setTipoDescuento('porcentaje')}
                                    >
                                        <Text style={[styles.optionText, tipoDescuento === 'porcentaje' && styles.optionTextActive]}>
                                            Porcentaje (%)
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Valor del Descuento</Text>
                                <TextInput
                                    style={styles.input}
                                    value={valorDescuento}
                                    onChangeText={setValorDescuento}
                                    placeholder="Ejemplo: 5"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.label}>Días de Validez</Text>
                                <TextInput
                                    style={styles.input}
                                    value={diasValidez}
                                    onChangeText={setDiasValidez}
                                    placeholder="Ejemplo: 30"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="number-pad"
                                />

                                <TouchableOpacity
                                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                                    onPress={generarYCerrar}
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        <Text style={styles.buttonText}>Generar Lote Mágico</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}
