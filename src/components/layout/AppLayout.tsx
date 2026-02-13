import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto scroll-smooth pos-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
