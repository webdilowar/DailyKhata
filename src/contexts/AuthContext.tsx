import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppUser,
  RegisterCredentials,
  subscribeToAuthState,
  loginWithCredentials,
  registerWithCredentials,
  loginWithGoogle as authLoginWithGoogle,
  logoutUser,
  resetPassword as authResetPassword,
  loginAsDemoUser,
  loginWithLocalProfile,
} from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isConfigured: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  loginWithGoogle: (phone?: string, name?: string) => Promise<void>;
  loginWithProfile: (profile: { displayName?: string; email?: string; phoneNumber?: string }) => void;
  register: (
    credsOrEmail: string | RegisterCredentials,
    pass?: string,
    name?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const loggedIn = await loginWithCredentials(identifier, pass);
    setUser(loggedIn);
  };

  const loginWithGoogle = async (phone?: string, name?: string) => {
    const loggedIn = await authLoginWithGoogle(phone, name);
    setUser(loggedIn);
  };

  const loginWithProfile = (profile: { displayName?: string; email?: string; phoneNumber?: string }) => {
    const customUser = loginWithLocalProfile(profile);
    setUser(customUser);
  };

  const register = async (
    credsOrEmail: string | RegisterCredentials,
    pass?: string,
    name?: string
  ) => {
    let creds: RegisterCredentials;
    if (typeof credsOrEmail === 'string') {
      creds = {
        email: credsOrEmail,
        password: pass || '',
        displayName: name,
      };
    } else {
      creds = credsOrEmail;
    }
    const registered = await registerWithCredentials(creds);
    setUser(registered);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const resetUserPassword = async (email: string) => {
    await authResetPassword(email);
  };

  const enterDemoMode = () => {
    const demo = loginAsDemoUser();
    setUser(demo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        login,
        loginWithGoogle,
        loginWithProfile,
        register,
        logout,
        resetUserPassword,
        resetPassword: resetUserPassword,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
