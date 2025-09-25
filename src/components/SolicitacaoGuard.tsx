import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SolicitacaoGuardProps {
  children: React.ReactNode;
}

export const SolicitacaoGuard = ({ children }: SolicitacaoGuardProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isRequestUser = localStorage.getItem('request_user_authenticated');
    if (isRequestUser !== 'true') {
      navigate('/solicitacao-login');
    }
  }, [navigate]);

  const isRequestUser = localStorage.getItem('request_user_authenticated');
  
  if (isRequestUser !== 'true') {
    return null;
  }

  return <>{children}</>;
};