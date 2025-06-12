import { Request, Response } from "express";
import { AuthorizationCode } from "simple-oauth2";
import dotenv from "dotenv";

dotenv.config();

const client = new AuthorizationCode({
  client: {
    id: process.env.QUICKBOOKS_CLIENT_ID!,
    secret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: "https://oauth.platform.intuit.com",
    authorizePath: "/oauth2/v1/tokens/bearer",
    tokenPath: "/oauth2/v1/tokens/bearer",
  },
});

export const startOAuth = (req: Request, res: Response) => {
  const authorizationUri = client.authorizeURL({
    redirect_uri: process.env.CALLBACK_URL!,
    scope: "com.intuit.quickbooks.accounting",
    state: "some-random-state",
  });

  res.redirect(authorizationUri);
};

export const quickbooksCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    const accessToken = await client.getToken({
      code: code as string,
      redirect_uri: process.env.CALLBACK_URL!,
      scope: "com.intuit.quickbooks.accounting",
    });

    // For demo: show token. In prod, save to DB!
    console.log("Access Token:", accessToken.token);
    res.send("OAuth Success! Access token saved.");
  } catch (error) {
    console.error("Access Token Error", error);
    res.status(500).json("OAuth callback error");
  }
};

export const verifyInvoice = async (req: Request, res: Response) => {
  // Example of using accessToken to call QuickBooks APIs
  const { invoiceId } = req.body;
  // TODO: Use accessToken to call QuickBooks API and verify invoice
  res.json({ invoiceId, status: "mock verified!" });
};
