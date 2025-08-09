import { useAuth as useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  
  const isAuthenticated = !!auth.user;
  const isLoading = auth.loading;
  
  return {
    ...auth,
    isAuthenticated,
    isLoading,
  };
}; 