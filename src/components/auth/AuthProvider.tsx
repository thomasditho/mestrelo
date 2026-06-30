import { ReactNode } from 'react';
import { AuthContext, useAuthState } from '../../hooks/useAuth';
// AuthProvider envolve toda a app e disponibiliza o contexto de auth

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
