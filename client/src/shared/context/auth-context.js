import { createContext } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  login: (uid, token) => {},
  logout: () => {},
  userId: null,
  token: null,
});
