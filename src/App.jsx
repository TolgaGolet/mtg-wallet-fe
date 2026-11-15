import { lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  Route,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import PrivateRoute from "./utils/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

// layouts
import RootLayout from "./layouts/RootLayout";

// pages: Home, Login and NotFound are the landing pages, so they're in the main bundle;
// the others are loaded on first visit (each is its own chunk)
import NotFound from "./pages/NotFound";
import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import RouteError from "./pages/RouteError";
import ScrollToTop from "./utils/ScrollToTop";

const SignUp = lazy(() => import("./pages/SignUp"));
const Accounts = lazy(() => import("./pages/Accounts/Accounts"));
const CreateOrEditAccount = lazy(
  () => import("./pages/Accounts/CreateOrEditAccount")
);
const HelpContact = lazy(() => import("./pages/HelpContact"));
const AccountDetail = lazy(() => import("./pages/Accounts/AccountDetail"));
const Categories = lazy(() => import("./pages/Categories/Categories"));
const CreateOrEditCategory = lazy(
  () => import("./pages/Categories/CreateOrEditCategory")
);
const Payees = lazy(() => import("./pages/Payees/Payees"));
const CreateOrEditPayee = lazy(
  () => import("./pages/Payees/CreateOrEditPayee")
);
const Transactions = lazy(() => import("./pages/Transactions/Transactions"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const AccountRecovery = lazy(() => import("./pages/AccountRecovery"));
const RecoverAccount = lazy(() => import("./pages/RecoverAccount"));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      errorElement={<RouteError />}
      element={
        <AuthProvider>
          <ScrollToTop />
          <RootLayout />
        </AuthProvider>
      }
    >
      <Route path="login" element={<Login />} />
      <Route path="register" element={<SignUp />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />
      <Route path="verify-email/:token" element={<VerifyEmail />} />
      <Route path="account-recovery" element={<AccountRecovery />} />
      <Route path="recover-account/:token" element={<RecoverAccount />} />
      <Route path="help-contact" element={<HelpContact />} />
      {/* The old path, for bookmarks */}
      <Route
        path="helpContact"
        element={<Navigate to="/help-contact" replace />}
      />
      {/* Everything below needs a logged-in user */}
      <Route element={<PrivateRoute />}>
        <Route index element={<Home />} />
        <Route path="accounts" element={<Accounts />} />
        <Route
          path="accounts/create-or-edit/:accountId"
          element={<CreateOrEditAccount />}
        />
        <Route path="accounts/:accountId" element={<AccountDetail />} />
        <Route path="payees" element={<Payees />} />
        <Route
          path="payees/create-or-edit/:payeeId"
          element={<CreateOrEditPayee />}
        />
        <Route path="categories" element={<Categories />} />
        <Route
          path="categories/create-or-edit/:categoryId"
          element={<CreateOrEditCategory />}
        />
        <Route path="transactions" element={<Transactions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
