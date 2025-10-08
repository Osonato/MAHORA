import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

export default function TablesScreen() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
  try {
    console.log("Intentando conectar al backend...");
    const response = await fetch("http://localhost:3000/tareas");
    console.log("Status:", response.status);
    const json = await response.json();
    console.log("Datos recibidos:", json);
    setTareas(json);
    setLoading(false);
  } catch (err) {
    console.log("Error al conectar:", err);
    setError("Error al cargar los datos");
    setLoading(false);
  }
};


  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.id]}>{item.ID_tareas}</Text>
      <Text style={[styles.cell, styles.name]}>{item.Nombre}</Text>
      <Text style={[styles.cell, styles.desc]}>{item.Descripcion}</Text>
      <Text style={[styles.cell, styles.date]}>{item.Fecha_inicio}</Text>
      <Text style={[styles.cell, styles.date]}>{item.Fecha_fin}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Asignado}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Creador}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tabla de Tareas</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView horizontal>
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.cell, styles.id]}>ID</Text>
              <Text style={[styles.cell, styles.name]}>Nombre</Text>
              <Text style={[styles.cell, styles.desc]}>Descripción</Text>
              <Text style={[styles.cell, styles.date]}>Fecha Inicio</Text>
              <Text style={[styles.cell, styles.date]}>Fecha Fin</Text>
              <Text style={[styles.cell, styles.user]}>Asignado</Text>
              <Text style={[styles.cell, styles.user]}>Creador</Text>
            </View>

            {/* Datos */}
            <FlatList
              data={tareas}
              keyExtractor={(item) => item.ID_tareas.toString()}
              renderItem={renderItem}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  header: { flexDirection: "row", borderBottomWidth: 2, borderColor: "#007BFF", paddingBottom: 5, backgroundColor: "#e0f0ff" },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  cell: { fontSize: 14, paddingHorizontal: 5 },
  id: { width: 40, textAlign: "center" },
  name: { width: 120, textAlign: "center" },
  desc: { width: 200, textAlign: "center" },
  date: { width: 100, textAlign: "center" },
  user: { width: 100, textAlign: "center" },
  error: { color: "red", textAlign: "center", marginTop: 20 },
});
