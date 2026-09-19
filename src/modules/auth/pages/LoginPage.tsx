import { useState } from "react";
import type { User } from "../../../shared/types";
export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="login card"
      onSubmit={(event) => {
        event.preventDefault();
        onLogin({ id: "", email, password, name: email });
      }}
    >
      <h1>MiniERP</h1>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña"
        type="password"
      />
      <button type="submit">Ingresar</button>
    </form>
  );
}
