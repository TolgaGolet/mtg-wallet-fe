import "./App.css";
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import PrivateRoute from "./utils/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

// layouts
import RootLayout from "./layouts/RootLayout";
import CareersLayout from "./layouts/CareersLayout";
import CareersError from "./pages/careers/CareersError";

// pages
import NotFound from "./pages/NotFound";
import Careers, { careersLoader } from "./pages/careers/Careers";
import CareerDetails, {
  careerDetailsLoader,
} from "./pages/careers/CareerDetails";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import HelpContact from "./pages/HelpContact";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={
        <AuthProvider>
          <RootLayout />
        </AuthProvider>
      }
    >
      <Route
        index
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<SignUp />} />
      <Route path="helpContact" element={<HelpContact />} />
      {/* TODO CHECK Loaders, Route Parameters And ErrorElement Example */}
      <Route
        path="careers"
        element={<CareersLayout />}
        errorElement={<CareersError />}
      >
        <Route index element={<Careers />} loader={careersLoader} />
        <Route
          path=":id"
          element={<CareerDetails />}
          loader={careerDetailsLoader}
        ></Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
