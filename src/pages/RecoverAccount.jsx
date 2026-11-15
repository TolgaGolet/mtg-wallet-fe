import TokenActionPage from "../components/TokenActionPage";

export default function RecoverAccount() {
  return (
    <TokenActionPage
      title="Account recovery"
      url={(token) => `auth/account-recovery/recover/${token}`}
      successMessage="Two-factor authentication has been disabled for your account. Turn it on again in Settings once you have logged in, to keep your account secure."
    />
  );
}
