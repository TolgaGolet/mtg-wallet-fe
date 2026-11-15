import { useContext, useState } from "react";
import {
  Card,
  Text,
  Button,
  TextInput,
  Stack,
  Group,
  Alert,
  CopyButton,
  ActionIcon,
  Code,
  Skeleton,
  FocusTrap,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconShieldLock,
} from "@tabler/icons-react";
import useAxios from "../../utils/useAxios";
import showNotification from "../../components/showNotification";
import LoadError from "../../components/LoadError";
import useApiQuery from "../../utils/useApiQuery";
import { TOTP_INPUT_PROPS, validateTotp } from "../../validation/rules";
import AuthContext from "../../context/AuthContext";

/** A one-field form for a 6-digit authenticator code, validated as the user types. */
const useCodeForm = () =>
  useForm({
    validateInputOnChange: true,
    initialValues: { code: "" },
    validate: { code: validateTotp },
  });

const codeInputProps = {
  ...TOTP_INPUT_PROPS,
  autoFocus: true,
  size: "md",
};

/**
 * The body of the 2FA dialog (Settings gives the dialog its title).
 * `onChange(enabled)` tells the parent the new 2FA state, so it can update without a reload.
 */
export function TotpSetup({ close, twoFactorEnabled, onChange }) {
  const [isDisabling, setIsDisabling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const callApi = useAxios();
  const { adoptTokens } = useContext(AuthContext);
  const enableForm = useCodeForm();
  const disableForm = useCodeForm();
  // Only a user without 2FA needs a new secret and QR code
  const setupQuery = useApiQuery(
    (signal) =>
      twoFactorEnabled
        ? Promise.resolve(null)
        : callApi
            .post("auth/totp/setup", {}, { signal })
            .then((response) => response?.data),
    [twoFactorEnabled]
  );
  const qrData = setupQuery.data;
  const loading = setupQuery.loading || isDisabling;
  const loadError = Boolean(setupQuery.error);

  const verifyAndEnableTotp = ({ code }) => {
    setVerifying(true);
    callApi
      .post("auth/totp/verify-setup", { code })
      .then(({ data }) => {
        // Enabling 2FA revokes every session, this one too, and answers a fresh token pair:
        // keep using the old tokens and the next request logs the user out
        if (data?.accessToken) {
          adoptTokens(data);
        }
        setVerifying(false);
        showNotification("2FA has been successfully enabled!", "success");
        close();
        onChange?.(true);
      })
      .catch(() => {
        setVerifying(false);
      });
  };

  const handleDisable2FA = ({ code }) => {
    setIsDisabling(true);
    callApi
      .post("auth/totp/disable", { code })
      .then(() => {
        showNotification("2FA has been successfully disabled!", "success");
        close();
        onChange?.(false);
      })
      .catch(() => {
        setIsDisabling(false);
      });
  };

  if (twoFactorEnabled) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Alert
            icon={<IconShieldLock size="1rem" />}
            title="2FA is Currently Enabled"
            color="teal"
          >
            Your account is currently protected with two-factor authentication.
            To disable 2FA, please enter your current authenticator code for
            verification.
          </Alert>

          <form onSubmit={disableForm.onSubmit(handleDisable2FA)}>
            <Stack gap="md">
              <TextInput
                label="Current 2FA Code"
                placeholder="Enter your 6-digit code"
                {...disableForm.getInputProps("code")}
                {...codeInputProps}
                required
              />

              <Group justify="center">
                <Button
                  type="submit"
                  color="red"
                  loading={loading}
                  disabled={!disableForm.isValid()}
                  size="md"
                >
                  Verify and Disable 2FA
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {loading ? (
          <>
            <Skeleton height={190} mt={10} />
            <Skeleton height={250} mt={10} />
          </>
        ) : loadError ? (
          <LoadError
            title="Couldn't start 2FA setup"
            onRetry={setupQuery.retry}
          />
        ) : (
          <>
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Important!"
              color="yellow"
            >
              Scan this QR code with your authenticator app (Google
              Authenticator, Microsoft Authenticator, etc.). If you can't scan
              the QR code, you can manually enter the secret key below.
            </Alert>

            <Card.Section p="md">
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={`data:image/png;base64,${qrData.qrCodeImage}`}
                  alt="2FA QR Code"
                  style={{ width: 200, height: 200 }}
                />
              </div>
            </Card.Section>
            <Center>
              <form onSubmit={enableForm.onSubmit(verifyAndEnableTotp)}>
                <FocusTrap active={true}>
                  <Text size="sm">Secret Key:</Text>
                  <Group gap="xs" mt="xs" mb="sm">
                    <Code>{qrData.secret}</Code>
                    <CopyButton value={qrData.secret} timeout={2000}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                          aria-label={
                            copied ? "Secret key copied" : "Copy secret key"
                          }
                        >
                          {copied ? (
                            <IconCheck size="1rem" aria-hidden />
                          ) : (
                            <IconCopy size="1rem" aria-hidden />
                          )}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>

                  <TextInput
                    label="Verification Code"
                    placeholder="Enter the 6-digit code"
                    {...enableForm.getInputProps("code")}
                    {...codeInputProps}
                  />

                  <Group justify="space-between">
                    <Button
                      type="submit"
                      loading={verifying}
                      disabled={!enableForm.isValid()}
                      style={{ margin: "auto" }}
                      mt="md"
                      size="md"
                    >
                      Verify and Enable 2FA
                    </Button>
                  </Group>
                </FocusTrap>
              </form>
            </Center>
          </>
        )}
      </Stack>
    </Card>
  );
}
