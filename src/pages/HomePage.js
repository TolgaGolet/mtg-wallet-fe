import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";

const HomePage = () => {
  const callApi = useAxios();
  let [message, setMessage] = useState("");

  useEffect(() => {
    callApi.get("/api/test/get-message").then((response) => {
      setMessage(response.data);
    });
  }, [callApi]);

  return (
    <div>
      <p>You are logged to the home page!</p>
      <p>message: {message}</p>
    </div>
  );
};

export default HomePage;
