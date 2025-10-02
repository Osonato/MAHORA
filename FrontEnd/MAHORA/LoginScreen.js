import React, { useState } from "react";
import { Platform } from "react-native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false); // true si login correcto

  const [debug, setDebug] = useState("");
  const handleLogin = async () => {
    let url = "http://10.0.2.2:3000/login";
    if (Platform.OS === "web") {
      url = "http://localhost:3000/login";
    }
    try {
      setDebug(`Enviando a: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Correo: correo, Password: password }),
      });

      setDebug(prev => prev + `\nStatus del backend: ${response.status}`);

      const data = await response.json();
      setDebug(prev => prev + `\nRespuesta del backend: ${JSON.stringify(data)}`);

      if (data.success) {
        setMensaje("Usuario correcto");
        setMensajeExito(true);
      } else {
        setMensaje("Usuario no encontrado");
        setMensajeExito(false);
      }
    } catch (error) {
      setDebug(prev => prev + `\nError de conexión: ${error}`);
      setMensaje("Error de conexión al servidor");
      setMensajeExito(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      {mensaje ? (
        <Text style={mensajeExito ? styles.success : styles.error}>{mensaje}</Text>
      ) : null}
      {debug ? (
        <Text style={{ marginTop: 10, fontSize: 12, color: '#555' }}>{debug}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, marginBottom: 20, fontWeight: "bold" },
  input: { width: "100%", height: 50, borderWidth: 1, borderColor: "#ccc", marginBottom: 15, borderRadius: 8, paddingHorizontal: 10 },
  button: { backgroundColor: "#007BFF", padding: 15, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  success: { marginTop: 15, fontSize: 16, color: "green" },
  error: { marginTop: 15, fontSize: 16, color: "red" },
});
