import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MoralisProvider } from "react-moralis";

import dynamic from "next/dynamic";
require("@solana/wallet-adapter-react-ui/styles.css");
import "./../styles/comfortaa.css";

const WalletConnectionProvier = dynamic(
  () => import("../context/WalletConnectionProvider"),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MoralisProvider
      serverUrl={
        process.env.NEXT_URL_SERVER ||
        "https://ojvrds0brtt6.usemoralis.com:2053/server"
      }
      appId={
        process.env.NEXT_APP_ID || "HMG8jUPBars3NXWi1fZaA9Q8ImfhtI4RzVeVahnI"
      }
    >
      <WalletConnectionProvier>
        <Component {...pageProps} />
      </WalletConnectionProvier>
    </MoralisProvider>
  );
}

export default MyApp;
