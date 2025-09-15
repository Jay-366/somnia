import { createThirdwebClient } from "thirdweb";

// Replace with your client ID from thirdweb dashboard
// For development, you can get a free client ID from https://thirdweb.com/dashboard
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "your-client-id-here";

export const client = createThirdwebClient({
  clientId: CLIENT_ID,
});