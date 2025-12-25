import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // No Firebase needed for demo - just simple mock authentication

  const login = async (username: string, password: string) => {
    // For demo purposes, authenticate against backend users
    // In a real app, this would connect to your backend auth service
    if ((username === 'admin' || username === 'user') && password === 'password') {
      try {
        // Fetch user from backend by username to get the correct ID
        const response = await fetch(`/api/users/username/${username}`);
        if (response.ok) {
          const user = await response.json();
          setUser(user);
        } else {
          throw new Error('User not found in backend');
        }
      } catch (error) {
        // Fallback to mock user if backend call fails
        console.warn('Backend user lookup failed, using mock data:', error);
        const mockUser: User = {
          id: username === 'admin' ? 'admin-id' : 'user-id',
          username: username,
          email: `${username}@maintain.ai`,
          role: username === 'admin' ? 'admin' : 'user',
          credibilityScore: username === 'admin' ? 95 : 88,
          firebaseUid: `${username}-firebase-uid`,
          createdAt: new Date(),
        };
        setUser(mockUser);
      }
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = async () => {
    // Simple logout - clear user state
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
