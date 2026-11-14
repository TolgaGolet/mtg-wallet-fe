import { Button, Center, rem, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getErrorMessage,
  NETWORK_ERROR_MESSAGE,
  publicApi,
} from "../api/client";

export default function RecoverAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async (token) => {
      try {
        // The page shows the error itself, so no toast
        await publicApi.post(
          `auth/account-recovery/recover/${token}`,
          {},
          { silentErrors: true }
        );
        setIsComplete(true);
      } catch (error) {
        setErrorMessage(
          error.response ? getErrorMessage(error) : NETWORK_ERROR_MESSAGE
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken(token);
    } else {
      navigate("/", { replace: false });
    }
  }, [token, navigate]);

  const renderSuccess = () => {
    return (
      <>
        <Center>
          <IconCheck
            style={{
              width: rem(125),
              height: rem(125),
              color: "teal",
            }}
          />
        </Center>
        <Center>
          <Text>
            Two factor authentication has been disabled for your account. You
            should enable this feature once you login for your security.
          </Text>
        </Center>
        <Center>
          <Button
            onClick={() => navigate("/", { replace: false })}
            mt="md"
            size="md"
          >
            Go to login page
          </Button>
        </Center>
      </>
    );
  };

  const renderLoading = () => {
    return <Text>Verifying...</Text>;
  };

  const renderError = () => {
    return <Text>{errorMessage}</Text>;
  };

  const renderContent = isComplete ? renderSuccess() : renderError();

  return <>{isLoading ? renderLoading() : renderContent}</>;
}
