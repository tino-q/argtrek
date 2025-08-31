import { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [email, setEmail] = useState(() => {
    const stored = localStorage.getItem("authEmail");
    return stored || "";
  });

  const [password, setPassword] = useState(() => {
    const stored = localStorage.getItem("authPassword");
    return stored || "";
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist email and password to localStorage whenever they change
  useEffect(() => {
    if (email) {
      localStorage.setItem("authEmail", email);
    } else {
      localStorage.removeItem("authEmail");
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      localStorage.setItem("authPassword", password);
    } else {
      localStorage.removeItem("authPassword");
    }
  }, [password]);

  // Function to clear auth data (for logout)
  const clearAuth = () => {
    setEmail("");
    setPassword("");
    localStorage.removeItem("authEmail");
    localStorage.removeItem("authPassword");
  };

  const value = {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    setIsLoading,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
