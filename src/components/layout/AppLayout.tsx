import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollToTop from '../animations/ScrollToTop';

const AppLayout = () => {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main ref={mainRef} className="flex-1 overflow-auto scroll-smooth pos-scrollbar">
        <Outlet />
        <ScrollToTop scrollContainer={mainRef.current} />
      </main>
    </div>
  );
};

export default AppLayout;
