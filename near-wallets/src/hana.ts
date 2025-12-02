import { NearRpc } from "./utils/rpc";

const provider = new NearRpc(window.selector?.providers?.mainnet);

const checkExist = async () => {
  try {
    await window.selector.external("hanaWallet.near", "account");
  } catch {
    const downloadUrl = "https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl";

    await window.selector.ui.whenApprove({ title: "Download Hana Wallet", button: "Download" });
    window.selector.open(downloadUrl);
  }
};

const hana = async (method: string, ...params: any[]): Promise<any> => {
  return await window.selector.external("hanaWallet.near", method, ...params);
};

const hanaWallet = async () => {
  const signOut = async () => {
    await hana("disconnect");
  };

  const getAccounts = async () => {
    const { accountId } = await hana("account");
    if (!accountId) return [];
    return [{ accountId }];
  };

  return {
    async signIn({ contractId, methodNames }: any) {
      try {
        await checkExist();
        const { publicKey, accountId } = await hana("account");
        return [{ accountId, publicKey }];
      } catch (_) {
        await signOut();
        throw new Error("Failed to sign in");
      }
    },

    signOut,
    getAccounts,

    async verifyOwner() {
      throw new Error(`Method not supported by Hana Wallet`);
    },

    async signMessage({ message, nonce, recipient, state }: any) {
      try {
        await checkExist();

        const signedMessage = await hana("signMessage", message, recipient);
        return signedMessage;
      } catch (error) {
        throw new Error("sign Error");
      }
    },

    async signAndSendTransaction({ receiverId, actions }: any) {
      await checkExist();

      const [{ accountId }] = await this.getAccounts();
      if (!accountId) throw new Error("Wallet not signed in");
      if (!receiverId) throw new Error("Receiver ID is required");

      try {
        const { txHash } = await hana("signAndSendTransaction", receiverId, actions);
        if (!txHash) throw new Error("No transaction hash received");

        return await provider.txStatus(txHash, "unused", "NONE");
      } catch (error) {
        console.error("signAndSendTransaction", error);
        throw new Error("sign Error");
      }
    },

    async signAndSendTransactions({ transactions }: any) {
      await checkExist();

      try {
        const results = [];

        for (let i = 0; i < transactions.length; i++) {
          const transaction = await this.signAndSendTransaction(transactions[i]);
          results.push(transaction);
        }

        return results;
      } catch (error) {
        console.error("signAndSendTransactions", error);
        throw new Error("sign Error");
      }
    },

    async createSignedTransaction() {
      throw new Error(`Method not supported by Hana Wallet`);
    },

    async signTransaction() {
      throw new Error(`Method not supported by Hana Wallet`);
    },

    async getPublicKey() {
      throw new Error(`Method not supported by Hana Wallet`);
    },

    async signNep413Message() {
      throw new Error(`Method not supported by Hana Wallet`);
    },

    async signDelegateAction() {
      throw new Error(`Method not supported by Hana Wallet`);
    },
  };
};

hanaWallet().then((wallet) => {
  window.selector.ready(wallet);
});
