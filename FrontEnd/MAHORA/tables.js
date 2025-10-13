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
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

export default function TablesScreen() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para eliminar
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedToDelete, setSelectedToDelete] = useState(null);

  // Estados para agregar
  const [addMode, setAddMode] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible
  const [form, setForm] = useState({
    Nombre: "",
    Descripcion: "",
    Fecha_inicio: "",
    Fecha_fin: "",
    Asignado: "",
    Creador: "",
  });

  //Modal para editar
  // --- MODAL DE EDITAR ---
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


  // Sugerencias para Asignado/Creador (extraídas de tareas actuales)
  const [usuariosSugeridos, setUsuariosSugeridos] = useState([]);
  const [sugerenciasAsignado, setSugerenciasAsignado] = useState([]);
  const [sugerenciasCreador, setSugerenciasCreador] = useState([]);

  useEffect(() => {
    fetchTareas();
  }, []);

  // Fetch principal: obtiene lista de tareas
  const fetchTareas = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/tareas"); // BACKEND: GET /tareas -> devuelve array JSON de tareas
      const json = await response.json();

      // Normaliza campos (por si vienen con nombres distintos)
      const dataMapped = json.map((t) => ({
        ID: t.ID_tareas || t.Identificacion || t.ID || t.id,
        Nombre: t.Nombre || t.nombre || "",
        Descripcion: t.Descripcion || t.descripcion || "",
        Fecha_inicio: t.Fecha_inicio || t.fecha_inicio || t.Fecha_inicio_tarea || "",
        Fecha_fin: t.Fecha_fin || t.fecha_fin || t.Fecha_fin_tarea || "",
        Asignado: t.Asignado || t.asignado || "",
        Creador: t.Creador || t.creador || "",
        __raw: t, // mantengo la raw por si el backend devuelve otros campos
      }));

      setTareas(dataMapped);
      setLoading(false);
      setError("");

      // Generar lista de usuarios (únicos) para sugerencias
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

  // --- FUNCIONES PARA ELIMINAR ---
  // Filtrado en tiempo real por ID o Nombre
  useEffect(() => {
    if (!searchText) {
      setFiltered(tareas);
      return;
    }
    const lower = searchText.toLowerCase();
    const res = tareas.filter(
      (t) =>
        (t.ID && t.ID.toString().toLowerCase().includes(lower)) ||
        (t.Nombre && t.Nombre.toLowerCase().includes(lower))
    );
    setFiltered(res);
  }, [searchText, tareas]);

  // Cuando se presiona eliminar definitivamente
  const confirmDelete = (task) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Deseas eliminar permanentemente la tarea "${task.Nombre}" (ID: ${task.ID})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => doDelete(task),
        },
      ]
    );
  };

  // Petición DELETE al backend
  const doDelete = async (task) => {
    try {
      // BACKEND: DELETE /tareas/:id
      // Respuesta esperada: 200/204 OK si se borra, o un JSON con { success: true }.
      const id = task.ID;
      const response = await fetch(`http://localhost:3000/tareas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        Alert.alert("Eliminado", `La tarea "${task.Nombre}" fue eliminada.`);
        // Refrescar lista
        setSelectedToDelete(null);
        setSearchText("");
        fetchTareas();
      } else {
        // Si backend devuelve JSON con mensaje de error
        const body = await response.text();
        Alert.alert("Error", `No se pudo eliminar la tarea. Backend: ${body}`);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar con el servidor para eliminar.");
    }
  };

  // --- FUNCIONES PARA AGREGAR ---
  // Animación del panel de agregar
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: addMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [addMode]);

  // Actualizar sugerencias mientras escribe Asignado/Creador
  useEffect(() => {
    const q = form.Asignado.toLowerCase();
    setSugerenciasAsignado(
      usuariosSugeridos.filter((u) => u.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [form.Asignado, usuariosSugeridos]);

  useEffect(() => {
    const q = form.Creador.toLowerCase();
    setSugerenciasCreador(
      usuariosSugeridos.filter((u) => u.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [form.Creador, usuariosSugeridos]);

  const submitAdd = () => {
    // Validaciones mínimas
    if (!form.Nombre.trim()) {
      Alert.alert("Validación", "El campo Nombre es obligatorio.");
      return;
    }

    Alert.alert(
      "Confirmar creación",
      `¿Deseas crear la tarea "${form.Nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Crear",
          onPress: () => doAdd(),
        },
      ]
    );
  };

  const doAdd = async () => {
    try {
      // BACKEND: POST /tareas
      // BODY JSON esperado:
      // {
      //   "Nombre": "Ejemplo",
      //   "Descripcion": "Detalle",
      //   "Fecha_inicio": "2025-10-11",
      //   "Fecha_fin": "2025-10-12",
      //   "Asignado": "usuarioA",
      //   "Creador": "usuarioB"
      // }
      // Respuesta esperada: 201 Created con el objeto creado o 200 con success.
      const response = await fetch("http://localhost:3000/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        // Opcional: leer json con la tarea creada
        // const created = await response.json();
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

  // --- ABRIR MODAL DE EDICIÓN ---
const openEditModal = (item) => {
  setEditTask({
    ID: item.ID,
    Nombre: item.Nombre,
    Descripcion: item.Descripcion,
    Fecha_inicio: item.Fecha_inicio,
    Fecha_fin: item.Fecha_fin,
    Asignado: item.Asignado,
    Creador: item.Creador,
  });
  setEditModalVisible(true);
};


// --- ACTUALIZAR TAREA ---
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



  // Renderizado de cada fila (ahora interactiva para selección en delete mode)
  const renderItem = ({ item, index }) => {
    const isSelected = selectedToDelete && selectedToDelete.ID === item.ID;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (deleteMode) {
            setSelectedToDelete(item);
          }
        }}
      >
        <View
          style={[
            styles.row,
            { backgroundColor: index % 2 === 0 ? "#ffffff" : "#f3f7fa" },
            isSelected && { borderColor: "#dc3545", borderWidth: 2 },
          ]}
        >
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{item.ID}</Text>
          </View>
          <Text style={[styles.cell, styles.name]}>{item.Nombre}</Text>
          <Text style={[styles.cell, styles.desc]} numberOfLines={2}>
            {item.Descripcion}
          </Text>
          <Text style={[styles.cell, styles.date]}>{formatDate(item.Fecha_inicio)}</Text>
          <Text style={[styles.cell, styles.date]}>{formatDate(item.Fecha_fin)}</Text>
          <Text style={[styles.cell, styles.user]}>{item.Asignado}</Text>
          <Text style={[styles.cell, styles.user]}>{item.Creador}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ffc107", paddingVertical: 6, paddingHorizontal: 8, minWidth: 80 }]}
            onPress={() => openEditModal(item)}
>
  <Text style={[styles.buttonText, { color: "#000" }]}>Editar</Text>
</TouchableOpacity>

        </View>
      </TouchableOpacity>
    );
  };

  // Formateador de fecha (igual que antes)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Animación de slide: calculamos translateX desde slideAnim (0..1)
  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0], // ajusta 400 según ancho esperado
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Tabla de Tareas</Text>

      {/* Botones superiores: Agregar y Eliminar */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#28a745" }]}
          onPress={() => {
            // abrir panel agregar
            setAddMode(true);
            // si estaba en modo eliminar, lo cerramos
            setDeleteMode(false);
            setSearchText("");
            setSelectedToDelete(null);
          }}
        >
          <Text style={styles.buttonText}>Agregar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#dc3545" }]}
          onPress={() => {
            setDeleteMode((s) => !s);
            setAddMode(false);
            setSearchText("");
            setSelectedToDelete(null);
          }}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>

        {/* Botón que ejecuta la eliminación una vez seleccionada */}
        {deleteMode && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#c82333" }]}
            onPress={() => {
              if (!selectedToDelete) {
                Alert.alert("Selecciona una tarea", "Primero selecciona una tarea para eliminar.");
                return;
              }
              confirmDelete(selectedToDelete);
            }}
          >
            <Text style={styles.buttonText}>Confirmar eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Si estamos en modo eliminar mostramos el buscador */}
      {deleteMode && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar por ID o Nombre..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={(t) => setSearchText(t)}
          />
          <Text style={styles.searchHint}>
            Busca por ID o Nombre. Toca una fila para seleccionar antes de confirmar.
          </Text>
        </View>
      )}
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

        <Text style={styles.inputLabel}>Fecha inicio (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={editTask.Fecha_inicio}
          onChangeText={(t) => setEditTask((s) => ({ ...s, Fecha_inicio: t }))}
        />

        <Text style={styles.inputLabel}>Fecha fin (YYYY-MM-DD)</Text>
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


      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.card}>
          <ScrollView horizontal>
            <View>
              {/* Encabezado */}
              <View style={styles.header}>
                <Text style={[styles.cell, styles.idHeader]}>ID</Text>
                <Text style={[styles.cell, styles.name]}>Nombre</Text>
                <Text style={[styles.cell, styles.desc]}>Descripción</Text>
                <Text style={[styles.cell, styles.date]}>Fecha Inicio</Text>
                <Text style={[styles.cell, styles.date]}>Fecha Fin</Text>
                <Text style={[styles.cell, styles.user]}>Asignado</Text>
                <Text style={[styles.cell, styles.user]}>Creador</Text>
              </View>

              {/* Filas: si estamos en deleteMode mostramos `filtered`, si no todas */}
              <FlatList
                data={deleteMode ? filtered : tareas}
                keyExtractor={(item, idx) => (item.ID ? item.ID.toString() : `i-${idx}`)}
                renderItem={renderItem}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* PANEL AGREGAR (deslizable) */}
      {/*
        Animated view que aparece desde la derecha.
        Contiene el formulario de agregar.
      */}
      <Animated.View
        pointerEvents={addMode ? "auto" : "none"}
        style={[
          styles.slidePanel,
          { transform: [{ translateX: panelTranslate }], opacity: addMode ? 1 : 0 },
        ]}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.panelContent}
          >
            <Text style={styles.panelTitle}>✚ Agregar Tarea</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={form.Nombre}
                onChangeText={(t) => setForm((s) => ({ ...s, Nombre: t }))}
                placeholder="Nombre de la tarea"
              />

              

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={form.Descripcion}
                onChangeText={(t) => setForm((s) => ({ ...s, Descripcion: t }))}
                placeholder="Descripción corta"
              />

              <Text style={styles.inputLabel}>Fecha inicio (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.Fecha_inicio}
                onChangeText={(t) => setForm((s) => ({ ...s, Fecha_inicio: t }))}
                placeholder="2025-10-11"
              />

              <Text style={styles.inputLabel}>Fecha fin (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.Fecha_fin}
                onChangeText={(t) => setForm((s) => ({ ...s, Fecha_fin: t }))}
                placeholder="2025-10-12"
              />

              <Text style={styles.inputLabel}>Asignado</Text>
              <TextInput
                style={styles.input}
                value={form.Asignado}
                onChangeText={(t) => setForm((s) => ({ ...s, Asignado: t }))}
                placeholder="Usuario asignado..."
              />
              {/* Sugerencias Asignado */}
              {sugerenciasAsignado.length > 0 && form.Asignado.length > 0 && (
                <View style={styles.suggestions}>
                  {sugerenciasAsignado.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setForm((s) => ({ ...s, Asignado: u }))}
                    >
                      <Text style={styles.suggestionItem}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Creador</Text>
              <TextInput
                style={styles.input}
                value={form.Creador}
                onChangeText={(t) => setForm((s) => ({ ...s, Creador: t }))}
                placeholder="Usuario creador..."
              />
              {/* Sugerencias Creador */}
              {sugerenciasCreador.length > 0 && form.Creador.length > 0 && (
                <View style={styles.suggestions}>
                  {sugerenciasCreador.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setForm((s) => ({ ...s, Creador: u }))}
                    >
                      <Text style={styles.suggestionItem}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ height: 12 }} />

              <View style={styles.panelButtons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#007BFF", marginRight: 8 }]}
                  onPress={submitAdd}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#6c757d" }]}
                  onPress={() => {
                    setAddMode(false);
                    setForm({
                      Nombre: "",
                      Descripcion: "",
                      Fecha_inicio: "",
                      Fecha_fin: "",
                      Asignado: "",
                      Creador: "",
                    });
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Backdrop cuando panel está abierto */}
      {addMode && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setAddMode(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#eef2f5",
    // alignItems center se quita para que la slide no se vea extraña en pantallas pequeñas
  },
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
    minHeight: 240,
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
  },
  cell: {
    fontSize: 14,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  idHeader: {
    width: 150,
    textAlign: "center",
    fontWeight: "bold",
    color: "#fff",
  },
  idBadge: {
    width: 150,
    backgroundColor: "#007BFF",
    borderRadius: 20,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  idText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  name: { width: 150, fontWeight: "bold" },
  desc: { width: 220 },
  date: { width: 140 },
  user: { width: 120 },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },

  // --- nuevos estilos UI ---
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
    marginRight: 8,
    minWidth: 110,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },

  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fff",
  },
  searchHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },

  // Panel deslizable
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
  panelContent: {
    flex: 1,
    padding: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
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

  // Sugerencias
  suggestions: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 6,
    marginTop: 6,
    maxHeight: 120,
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },

  // Backdrop
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 30,
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
