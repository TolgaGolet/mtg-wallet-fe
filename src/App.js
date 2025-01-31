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

// pages
import NotFound from "./pages/NotFound";
import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Accounts from "./pages/Accounts/Accounts";
import CreateOrEditAccount from "./pages/Accounts/CreateOrEditAccount";
import HelpContact from "./pages/HelpContact";
import AccountDetail from "./pages/Accounts/AccountDetail";
import Categories from "./pages/Categories/Categories";
import CreateOrEditCategory from "./pages/Categories/CreateOrEditCategory";
import Payees from "./pages/Payees/Payees";
import CreateOrEditPayee from "./pages/Payees/CreateOrEditPayee";
import Transactions from "./pages/Transactions/Transactions";
import ScrollToTop from "./utils/ScrollToTop";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings/Settings";
import AccountRecovery from "./pages/AccountRecovery";
import RecoverAccount from "./pages/RecoverAccount";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={
        <AuthProvider>
          <ScrollToTop />
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/account-recovery" element={<AccountRecovery />} />
      <Route path="/recover-account/:token" element={<RecoverAccount />} />
      <Route
        path="accounts"
        element={
          <PrivateRoute>
            <Accounts />
          </PrivateRoute>
        }
      />
      <Route
        path="accounts/create-or-edit/:accountId"
        element={
          <PrivateRoute>
            <CreateOrEditAccount />
          </PrivateRoute>
        }
      />
      <Route
        path="accounts/:accountId"
        element={
          <PrivateRoute>
            <AccountDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="payees"
        element={
          <PrivateRoute>
            <Payees />
          </PrivateRoute>
        }
      />
      <Route
        path="payees/create-or-edit/:payeeId"
        element={
          <PrivateRoute>
            <CreateOrEditPayee />
          </PrivateRoute>
        }
      />
      <Route
        path="categories"
        element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        }
      />
      <Route
        path="categories/create-or-edit/:categoryId"
        element={
          <PrivateRoute>
            <CreateOrEditCategory />
          </PrivateRoute>
        }
      />
      <Route path="helpContact" element={<HelpContact />} />
      <Route
        path="transactions"
        element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        }
      />
      <Route
        path="settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
