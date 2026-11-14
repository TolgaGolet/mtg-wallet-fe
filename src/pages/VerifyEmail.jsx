import TokenActionPage from "../components/TokenActionPage";

export default function VerifyEmail() {
  return (
    <TokenActionPage
      title="Email verification"
      url={(token) => `${import.meta.env.VITE_VERIFY_EMAIL_URL}/${token}`}
      successMessage="Your email address has been verified successfully. You can now log in."
    />
  );
}
