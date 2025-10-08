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
      const response = await fetch("http://localhost:3000/tareas");
      const json = await response.json();

      //Normalizamos los datos
      const dataMapped = json.map((t) => ({
        ID: t.ID_tareas || t.Identificacion || t.ID, 
        Nombre: t.Nombre,
        Descripcion: t.Descripcion,
        Fecha_inicio: t.Fecha_inicio,
        Fecha_fin: t.Fecha_fin,
        Asignado: t.Asignado,
        Creador: t.Creador,
      }));

      setTareas(dataMapped);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar los datos");
      setLoading(false);
    }
  };

  // Función para dar formato a fechas (DIA/MES/AÑO)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

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
      <Text style={[styles.cell, styles.desc]}>{item.Descripcion}</Text>
      <Text style={[styles.cell, styles.date]}>{formatDate(item.Fecha_inicio)}</Text>
      <Text style={[styles.cell, styles.date]}>{formatDate(item.Fecha_fin)}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Asignado}</Text>
      <Text style={[styles.cell, styles.user]}>{item.Creador}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Tabla de Tareas</Text>

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

              {/* Filas */}
              <FlatList
                data={tareas}
                keyExtractor={(item) => item.ID.toString()}
                renderItem={renderItem}
              />
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: "#eef2f5", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center", 
    color: "#2c3e50" 
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
    alignItems: "center"
  },
  cell: { 
    fontSize: 14, 
    paddingHorizontal: 10, 
    textAlign: "center" 
  },
  // Encabezado de ID
  idHeader: { 
    width: 150, 
    textAlign: "center", 
    fontWeight: "bold", 
    color: "#fff" 
  },
  // Badge para IDs
  idBadge: {
    width: 150,
    backgroundColor: "#007BFF",
    borderRadius: 20,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5
  },
  idText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  name: { width: 150, fontWeight: "bold" }, // Nombre en negrita
  desc: { width: 220 },
  date: { width: 140 },
  user: { width: 120 },
  error: { 
    color: "red", 
    textAlign: "center", 
    marginTop: 20, 
    fontSize: 16 
  },
});
