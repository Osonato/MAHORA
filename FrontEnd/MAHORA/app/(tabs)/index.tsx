import React, { useState } from "react";
import LoginScreen from "../../LoginScreen";
import Tables from "../../tables";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <Tables />
  ) : (
    <LoginScreen onLoginSuccess={() => setLoggedIn(true)} />
  );
}
