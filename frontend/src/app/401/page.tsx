import UnauthorizedPage from '@/components/UnauthorizedPage';

export default function Page401() {
  return (
    <UnauthorizedPage
      title="401 - No Autorizado"
      message="Tu sesión ha expirado o no tienes permisos para acceder a esta página."
      showLoginButton={true}
    />
  );
}
