import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <span>Xin chào, {user.username}!</span>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      ) : (
        <div>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/register">Đăng ký</Link>
        </div>
      )}
    </header>
  );
};