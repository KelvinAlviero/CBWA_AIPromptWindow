import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api.js";

const UserContext = createContext(null);

// Lets any protected page read the logged-in user: const user = useUser();
export function useUser() {
  return useContext(UserContext);
}

// Asks the server "who am I?". A 401 means no valid session, so go to /login.
// This is only for a nicer experience: the real protection is the JWT
// middleware on the server.
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    api
      .me()
      .then((me) => {
        setUser(me);
        setStatus("ok");
      })
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") return <p className="status-message">Loading…</p>;
  if (status === "denied") return <Navigate to="/login" replace />;

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
