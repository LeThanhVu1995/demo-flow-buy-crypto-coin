import "../styles/globals.css";
import type { AppProps } from "next/app";
import "./../styles/comfortaa.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6Ldb9_gfAAAAAObJHYgKp5ifrmL7U4iGIIUCTfGu">
      <Component {...pageProps} />
    </GoogleReCaptchaProvider>
  );
}

export default MyApp;
