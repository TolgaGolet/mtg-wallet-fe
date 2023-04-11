import { NavLink, Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function RootLayout() {
  return (
    <div className="root-layout">
      <header>
        <nav>
          <h1>MTG Wallet</h1>
          <NavLink to="/">Home</NavLink>
          <NavLink to="careers">Careers</NavLink>
        </nav>
      </header>
      <p>AuthHeader:</p>
      <Header></Header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
