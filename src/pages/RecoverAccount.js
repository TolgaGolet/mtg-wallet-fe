import { Button, Center, rem, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function RecoverAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      navigate("/", { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyToken = async (token) => {
    try {
      let response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}auth/account-recovery/recover/${token}`,
        {
          method: "POST",
        }
      );
      if (response?.status === 200) {
        setIsComplete(true);
      } else {
        const message = await response.text();
        setErrorMessage(message);
      }
    } catch (error) {
      setErrorMessage("Something went wrong! " + error.toString());
    }
    setIsLoading(false);
  };

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
