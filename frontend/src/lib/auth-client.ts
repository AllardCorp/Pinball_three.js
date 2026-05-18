import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { apiUrl } from "./api";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [usernameClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
