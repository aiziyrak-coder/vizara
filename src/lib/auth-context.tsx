import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User, Organization, setToken, clearToken, setUnauthorizedHandler, ApiError } from './api';

const ORG_STORAGE_KEY = 'vizara_current_org_id';

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function pickCurrentOrg(orgs: Organization[], prevId?: string | null): Organization | null {
  if (orgs.length === 0) return null;
  if (prevId) {
    const found = orgs.find((o) => o.id === prevId);
    if (found) return found;
  }
  const stored = localStorage.getItem(ORG_STORAGE_KEY);
  if (stored) {
    const fromStorage = orgs.find((o) => o.id === stored);
    if (fromStorage) return fromStorage;
  }
  return orgs[0];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem(ORG_STORAGE_KEY, org.id);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
      setOrganizations(data.organizations);
      setCurrentOrgState((prev) => {
        const next = pickCurrentOrg(data.organizations, prev?.id);
        if (next) localStorage.setItem(ORG_STORAGE_KEY, next.id);
        return next;
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        localStorage.removeItem(ORG_STORAGE_KEY);
        setUser(null);
        setOrganizations([]);
        setCurrentOrgState(null);
      }
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      localStorage.removeItem(ORG_STORAGE_KEY);
      setUser(null);
      setOrganizations([]);
      setCurrentOrgState(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('vizara_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setOrganizations(data.organizations);
    const org = pickCurrentOrg(data.organizations);
    if (org) setCurrentOrg(org);
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) => {
    const result = await api.register(data);
    setToken(result.token);
    setUser(result.user);
    setOrganizations([result.organization]);
    setCurrentOrg(result.organization);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(ORG_STORAGE_KEY);
    setUser(null);
    setOrganizations([]);
    setCurrentOrgState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        currentOrg,
        setCurrentOrg,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
