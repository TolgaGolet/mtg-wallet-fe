import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";

const Header = () => {
  let { user } = useContext(AuthContext);

  return <>{user && <p>Hello {user.sub}.</p>}</>;
};

export default Header;
