import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <nav>
      <Link to="/">Trang chủ</Link>
      <Link to="/products">Sản phẩm</Link>
      <Link to="/cart">Giỏ hàng</Link>
      
      {isAdmin() && (
        <>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/products">Quản lý sản phẩm</Link>
          <Link to="/admin/users">Quản lý users</Link>
        </>
      )}
    </nav>
  );
};