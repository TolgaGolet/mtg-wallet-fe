import { api } from "../api/client";

// Every component shares one axios instance, so token refreshes are shared too (see api/client.js).
const useAxios = () => api;

export default useAxios;
