import { NavLink, Outlet } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";

export default function RootLayout() {
  return (
    <div className="root-layout">
      <header>
        <nav>
          <h1>MTG Wallet</h1>
          <NavLink to="/">Home</NavLink>
          <NavLink to="accounts">Accounts</NavLink>
          <NavLink to="careers">Careers</NavLink>
        </nav>
        <p>Breadcrumbs</p>
        <Breadcrumbs></Breadcrumbs>
        <p>----</p>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
