import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

interface ServerRegistrationResponse {
  publicKey: PublicKeyCredentialCreationOptionsJSON;
}

interface ServerAuthenticationResponse {
  publicKey: PublicKeyCredentialRequestOptionsJSON;
}

export const startRegistrationFlow = async (username: string) => {
  try {
    // Get registration options from the server
    const response = await api.post<ServerRegistrationResponse>(
      `/api/auth/register_start/${username}`
    );

    // Extract the publicKey options from the response
    const options = response.data.publicKey;

    if (!options || !options.challenge) {
      throw new Error("Invalid server response");
    }

    // Pass the options to the SimpleWebAuthn browser function
    const attResp = await startRegistration({
      optionsJSON: options,
      useAutoRegister: true,
    });

    // Send the response back to the server
    const verificationResponse = await api.post(
      "/api/auth/register_finish",
      attResp
    );

    if (verificationResponse.status !== 200) {
      throw new Error("Registration verification failed");
    }

    return verificationResponse.data;
  } catch (error) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data || "Registration failed");
    }
    throw error;
  }
};

export const startAuthenticationFlow = async (username: string) => {
  try {
    // Get authentication options from the server
    const response = await api.post<ServerAuthenticationResponse>(
      `/api/auth/login_start/${username}`
    );

    // Extract the publicKey options from the response
    const options = response.data.publicKey;

    if (!options || !options.challenge) {
      throw new Error("Invalid server response");
    }

    // Pass the options to the SimpleWebAuthn browser function
    const asseResp = await startAuthentication({ optionsJSON: options });

    // Send the response back to the server
    const verificationResponse = await api.post(
      "/api/auth/login_finish",
      asseResp
    );

    if (verificationResponse.status !== 200) {
      throw new Error("Authentication verification failed");
    }

    return verificationResponse.data;
  } catch (error) {
    console.error("Authentication error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data || `Authentication failed ${error}`);
    }
    throw error;
  }
};
