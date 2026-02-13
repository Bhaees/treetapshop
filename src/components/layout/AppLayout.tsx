import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollToTop from '../animations/ScrollToTop';

const AppLayout = () => {
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);
  const mainRef = useCallback((node: HTMLElement | null) => {
    setMainEl(node);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main ref={mainRef} className="flex-1 overflow-auto scroll-smooth pos-scrollbar">
        <Outlet />
      </main>
      <ScrollToTop scrollContainer={mainEl} />
    </div>
  );
};

export default AppLayout;
