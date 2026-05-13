import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../../api/auth.js";
import { registerSessionExpiredHandler } from "../../api/client.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStore.js";

export const AuthContext = createContext(null);

function readAccessToken(payload) {
  return payload?.access || payload?.access_token || payload?.token || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      clearSession();
      window.location.assign("/login");
    });
  }, [clearSession]);

  useEffect(() => {
    if (!getAccessToken()) {
      setBootstrapping(false);
      return;
    }

    fetchCurrentUser()
      .then((profile) => {
        setUser(profile);
        setIsAuthenticated(true);
      })
      .catch(clearSession)
      .finally(() => setBootstrapping(false));
  }, [clearSession]);

  const login = useCallback(async (payload) => {
    const data = await loginUser(payload);
    const token = readAccessToken(data);
    if (!token) {
      throw new Error("Login succeeded but no access token was returned.");
    }
    setAccessToken(token);
    setIsAuthenticated(true);
    const profile = data.user || (await fetchCurrentUser());
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    const token = readAccessToken(data);
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      setUser(data.user || null);
    }
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchCurrentUser();
    setUser(profile);
    setIsAuthenticated(true);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      bootstrapping,
      clearSession,
      isAuthenticated,
      login,
      logout,
      refreshUser,
      register,
      setUser,
      user,
    }),
    [bootstrapping, clearSession, isAuthenticated, login, logout, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
