//frontend/src/layout/Layout.jsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import AppMenu from "./AppMenu";

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Topbar onMenuClick={() => setIsMenuOpen(true)} />

      <main className="main-content">
        <Outlet />
      </main>

      <AppMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default Layout;
