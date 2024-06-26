import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";

const Home = () => {
  const callApi = useAxios();
  let [message, setMessage] = useState("");

  useEffect(() => {
    callApi.get("test/get-message").then((response) => {
      setMessage(response.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <p>You are logged to the home page!</p>
      <p>message: {message}</p>
    </div>
  );
};

export default Home;
