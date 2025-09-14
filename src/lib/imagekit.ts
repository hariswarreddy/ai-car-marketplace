export const imageKitAuthenticator = async () => {
  try {
    const res = await fetch("/api/upload-auth");
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Request failed with status ${res.status}: ${errorText}`
        );
    }
      const data = await res.json();
      const { signature, expire, token, publicKey } = data;
       return { signature, expire, token, publicKey };
  } catch (error) {
       // Log the original error for debugging before rethrowing a new error.
    console.error("Authentication error:", error);
    throw new Error("Authentication request failed");
  }
};
