import React, { useEffect, useState, useRef } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function TablesScreen() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para agregar
  const [addMode, setAddMode] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [form, setForm] = useState({
    Nombre: "",
    Descripcion: "",
    Fecha_inicio: "",
    Fecha_fin: "",
    Asignado: "",
    Creador: "",
  });

  // Modal editar
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTask, setEditTask] = useState({
    ID: null,
    Nombre: "",
    Descripcion: "",
    Fecha_inicio: "",
    Fecha_fin: "",
    Asignado: "",
    Creador: "",
  });

  const [usuariosSugeridos, setUsuariosSugeridos] = useState([]);

  useEffect(() => {
    fetchTareas();
  }, []);

  // --- Obtener tareas ---
  const fetchTareas = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/tareas");
      const json = await response.json();

      const dataMapped = json.map((t) => ({
        ID: t.ID_tareas || t.id,
        Nombre: t.Nombre || "",
        Descripcion: t.Descripcion || "",
        Fecha_inicio: t.Fecha_inicio || "",
        Fecha_fin: t.Fecha_fin || "",
        Asignado: t.Asignado || "",
        Creador: t.Creador || "",
      }));

      setTareas(dataMapped);
      setLoading(false);
      setError("");

      const users = new Set();
      dataMapped.forEach((r) => {
        if (r.Asignado) users.add(r.Asignado);
        if (r.Creador) users.add(r.Creador);
      });
      setUsuariosSugeridos(Array.from(users));
    } catch (err) {
      setError("Error al cargar los datos");
      setLoading(false);
    }
  };

  // --- Eliminar tarea ---
  const confirmDelete = (task) => {
  if (Platform.OS === "web") {
    // Expo Web / RN Web: usar confirm nativo del navegador
    const ok = window.confirm(`¿Deseas eliminar la tarea "${task.Nombre}" (ID: ${task.ID})?`);
    if (ok) doDelete(task);
  } else {
    // Android / iOS: Alert con botones funciona bien
    Alert.alert(
      "Confirmar eliminación",
      `¿Deseas eliminar la tarea "${task.Nombre}" (ID: ${task.ID})?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => doDelete(task) },
      ]
    );
  }
};

  const doDelete = async (task) => {
    try {
      const id = task.ID;
      const response = await fetch(`http://localhost:3000/tareas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        Alert.alert("Eliminado", `La tarea "${task.Nombre}" fue eliminada.`);
        fetchTareas();
      } else {
        const body = await response.text();
        Alert.alert("Error", `No se pudo eliminar la tarea. Backend: ${body}`);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar con el servidor para eliminar.");
    }
  };

  // --- Agregar tarea ---
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: addMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [addMode]);

  const doAdd = async () => {
    if (!form.Nombre.trim()) {
      Alert.alert("Validación", "El campo Nombre es obligatorio.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        Alert.alert("Creado", "La tarea fue creada correctamente.");
        setAddMode(false);
        setForm({
          Nombre: "",
          Descripcion: "",
          Fecha_inicio: "",
          Fecha_fin: "",
          Asignado: "",
          Creador: "",
        });
        fetchTareas();
      } else {
        const body = await response.text();
        Alert.alert("Error", `No se pudo crear la tarea. Backend: ${body}`);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar con el servidor para crear la tarea.");
    }
  };

  // --- Editar tarea ---
  const openEditModal = (item) => {
    setEditTask(item);
    setEditModalVisible(true);
  };

  const doUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:3000/tareas/${editTask.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTask),
      });

      const res = await response.json();
      if (response.ok) {
        Alert.alert("Actualizado", res.message);
        setEditModalVisible(false);
        fetchTareas();
      } else {
        Alert.alert("Error", res.message || "No se pudo actualizar la tarea");
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  // --- Renderizado de filas ---
  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? "#ffffff" : "#f3f7fa" },
      ]}
    >
      <View style={styles.idBadge}>
        <Text style={styles.idText}>{item.ID}</Text>
      </View>
      <Text style={[styles.cell, styles.name]}>{item.Nombre}</Text>
      <Text style={[styles.cell, styles.desc]} numberOfLines={2}>
        {item.Descripcion}
      </Text>
      <Text style={[styles.cell, styles.date]}>{item.Fecha_inicio}</Text>
      <Text style={[styles.cell, styles.date]}>{item.Fecha_fin}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Asignado}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Creador}</Text>

      {/* Botones de acción */}
      <View style={{ flexDirection: "row", gap: 5 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ffc107" }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={[styles.buttonText, { color: "#000" }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#dc3545" }]}
          onPress={() => confirmDelete(item)}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- UI principal ---
  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Tabla de Tareas</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#28a745" }]}
          onPress={() => setAddMode(true)}
        >
          <Text style={styles.buttonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.card}>
          <ScrollView horizontal>
            <View>
              <View style={styles.header}>
                <Text style={[styles.cell, styles.idHeader]}>ID</Text>
                <Text style={[styles.cell, styles.name]}>Nombre</Text>
                <Text style={[styles.cell, styles.desc]}>Descripción</Text>
                <Text style={[styles.cell, styles.date]}>Fecha Inicio</Text>
                <Text style={[styles.cell, styles.date]}>Fecha Fin</Text>
                <Text style={[styles.cell, styles.user]}>Asignado</Text>
                <Text style={[styles.cell, styles.user]}>Creador</Text>
                <Text
                  style={[styles.cell, { width: 160, color: "#fff", fontWeight: "bold" }]}
                >
                  Acciones
                </Text>
              </View>

              <FlatList
                data={tareas}
                keyExtractor={(item, idx) => (item.ID ? item.ID.toString() : `i-${idx}`)}
                renderItem={renderItem}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* PANEL AGREGAR */}
      <Animated.View
        pointerEvents={addMode ? "auto" : "none"}
        style={[
          styles.slidePanel,
          { transform: [{ translateX: panelTranslate }], opacity: addMode ? 1 : 0 },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.panelContent}
        >
          <Text style={styles.panelTitle}>✚ Agregar Tarea</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={form.Nombre}
              onChangeText={(t) => setForm((s) => ({ ...s, Nombre: t }))}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={form.Descripcion}
              onChangeText={(t) => setForm((s) => ({ ...s, Descripcion: t }))}
            />

            <Text style={styles.inputLabel}>Fecha inicio (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.Fecha_inicio}
              onChangeText={(t) => setForm((s) => ({ ...s, Fecha_inicio: t }))}
            />

            <Text style={styles.inputLabel}>Fecha fin (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.Fecha_fin}
              onChangeText={(t) => setForm((s) => ({ ...s, Fecha_fin: t }))}
            />

            <Text style={styles.inputLabel}>Asignado</Text>
            <TextInput
              style={styles.input}
              value={form.Asignado}
              onChangeText={(t) => setForm((s) => ({ ...s, Asignado: t }))}
            />

            <Text style={styles.inputLabel}>Creador</Text>
            <TextInput
              style={styles.input}
              value={form.Creador}
              onChangeText={(t) => setForm((s) => ({ ...s, Creador: t }))}
            />

            <View style={{ height: 12 }} />

            <View style={styles.panelButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#007BFF", marginRight: 8 }]}
                onPress={doAdd}
              >
                <Text style={styles.buttonText}>Guardar Tarea</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#6c757d" }]}
                onPress={() => setAddMode(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* MODAL EDITAR */}
      {editModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Editar Tarea</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={editTask.Nombre}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Nombre: t }))}
              />

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={editTask.Descripcion}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Descripcion: t }))}
              />

              <Text style={styles.inputLabel}>Fecha inicio</Text>
              <TextInput
                style={styles.input}
                value={editTask.Fecha_inicio}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Fecha_inicio: t }))}
              />

              <Text style={styles.inputLabel}>Fecha fin</Text>
              <TextInput
                style={styles.input}
                value={editTask.Fecha_fin}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Fecha_fin: t }))}
              />

              <Text style={styles.inputLabel}>Asignado</Text>
              <TextInput
                style={styles.input}
                value={editTask.Asignado}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Asignado: t }))}
              />

              <Text style={styles.inputLabel}>Creador</Text>
              <TextInput
                style={styles.input}
                value={editTask.Creador}
                onChangeText={(t) => setEditTask((s) => ({ ...s, Creador: t }))}
              />

              <View style={styles.panelButtons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#007BFF", marginRight: 8 }]}
                  onPress={doUpdate}
                >
                  <Text style={styles.buttonText}>Guardar cambios</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#6c757d" }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#eef2f5" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#2c3e50",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderColor: "#007BFF",
    paddingVertical: 10,
    backgroundColor: "#007BFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  cell: { fontSize: 14, paddingHorizontal: 10, textAlign: "center" },
  idHeader: { width: 150, textAlign: "center", fontWeight: "bold", color: "#fff" },
  idBadge: {
    width: 150,
    backgroundColor: "#007BFF",
    borderRadius: 20,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  idText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  name: { width: 150, fontWeight: "bold" },
  desc: { width: 220 },
  date: { width: 140 },
  user: { width: 120 },
  error: { color: "red", textAlign: "center", marginTop: 20, fontSize: 16 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  slidePanel: {
    position: "absolute",
    right: 0,
    top: 90,
    width: 360,
    height: "80%",
    zIndex: 40,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    overflow: "hidden",
  },
  panelContent: { flex: 1, padding: 12 },
  panelTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  inputLabel: { fontSize: 13, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fff",
  },
  panelButtons: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "flex-start",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});
