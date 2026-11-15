import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

/**
 * Sends a logged-out visitor to /login. Used as a pathless layout route around every private page
 * (renders the matched child route), or around `children`.
 */
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace={true} />;
  }
  return children ?? <Outlet />;
};

export default PrivateRoute;
