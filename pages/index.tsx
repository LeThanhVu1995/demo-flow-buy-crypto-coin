import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import style from "./home.module.css";
import Web3 from "web3";
import {
  shopdiAbi,
  contractAddress,
  contractAbiToken,
  contractAddressToken,
} from "../constants/const";
import socketIOClient from "socket.io-client";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

function numberWithCommas(x: any) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function removeNumberWithCommas(x: any) {
  return x.replaceAll(".", "");
}

const connectionWallet = [
  {
    name: "Metamask",
    src: "/metamask.png",
    options: {},
    popular: true,
  },
];

const vouchersData = [
  {
    id: "ABCDEF",
    price: 1000000,
    displayPrice: numberWithCommas(1000000),
  },
  {
    id: "FBCDEF",
    price: 3000000,
    displayPrice: numberWithCommas(3000000),
  },
  {
    id: "YYCDEF",
    price: 5000000,
    displayPrice: numberWithCommas(5000000),
  },
  {
    id: "AFADEF",
    price: 15000000,
    displayPrice: numberWithCommas(15000000),
  },
  {
    id: "ABLKEF",
    price: 20000000,
    displayPrice: numberWithCommas(20000000),
  },
  {
    id: "ABCEEEF",
    price: 25000000,
    displayPrice: numberWithCommas(25000000),
  },
];

const serverURL: any =
  process.env.URL_SERVER || "https://nodejs-voucher.herokuapp.com";
const socketURL: any =
  process.env.URL_SERVER || "https://nodejs-voucher.herokuapp.com";

console.log(serverURL, socketURL);

const Home: NextPage = () => {
  const [vouchers, setVouchers] = useState(vouchersData);
  const [selectVoucher, setSelectVoucher] = useState("");
  const [valueVoucher, setValueVoucher] = useState(0);
  const [usdc, setUsdc] = useState(0);
  const [email, setEmail] = useState("");
  const [opened, setOpened] = useState(false);
  const popConnectRef = useRef<HTMLDivElement>();
  const popupPaymentLoadingRef = useRef<HTMLDivElement>();
  const [currentAccount, setCurrentAccount] = useState("");
  const [openedPaying, setOpenedPayingPopup] = useState(false);
  const [isPaying, setPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [balance, setBalance] = useState("");
  const [ethercanLink, setEtherscanLink] = useState("");
  const [walletSelect, setWalletSelect] = useState({});
  const [rateVnd, setRateVnd] = useState(0);
  const [dataQRCode, setDataQRCode] = useState("");
  const [displayInput, setDisplayInput] = useState("0");
  const [agree, setAgree] = useState(true);

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  const [contractToken, setContractToken] = useState(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const reset = () => {
    setSelectVoucher("");
    setValueVoucher(0);
    setUsdc(0);
    setEmail("");
    setOpened(false);
    setOpenedPayingPopup(false);
    setPaying(false);
    setIsPaid(false);
    setEtherscanLink("");
    setDataQRCode("");
    setDisplayInput("0");
  };

  const convertVNDToSHOD = (vnd: number) => {
    return Number((vnd / rateVnd).toFixed(3));
  };

  const connectMetamask = async () => {
    const { ethereum: provider } = window as any;

    if (typeof provider !== "undefined") {
      provider
        .request({ method: "eth_requestAccounts" })
        .then((accounts: any) => {
          const [account] = accounts;
          setCurrentAccount(account);
          setOpened(false);
        })
        .catch((err: any) => console.error(err));
    } else {
      alert("Please install metamask.");
    }
  };

  useEffect(() => {
    const socket = socketIOClient(socketURL);

    socket.on("payment-success", (data) => {
      const { user } = data;
      if (user === currentAccount) {
        console.log("already paid");
        setPaying(false);
        setIsPaid(true);
        setDataQRCode(JSON.stringify(data.data));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentAccount]);

  async function verifyCaptcha() {
    const getToken = executeRecaptcha as any;
    const captcha = await getToken("signup");

    const { data } = await axios.post(`${serverURL}/captcha`, { captcha });
    return data;
  }

  useEffect(() => {
    (async () => {
      const { ethereum } = window as any;

      if (!ethereum) {
        alert("Please install metamask");
        return;
      }

      const web3: any = new Web3(ethereum);
      const contract: any = new web3.eth.Contract(shopdiAbi, contractAddress);
      const contractToken: any = new web3.eth.Contract(
        contractAbiToken,
        contractAddressToken
      );
      setWeb3(web3);
      setContract(contract);
      setContractToken(contractToken);

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length) {
        setCurrentAccount(accounts[0]);
      }
    })();
  }, []);

  const signatureContract = async (params: any) => {
    const { data } = await axios.post(`${serverURL}/order`, params);
    return data;
  };

  const buyToken = async () => {
    if (!email) {
      alert("Please input your email");
      return;
    }

    if (!usdc) {
      alert("Please input your value voucher");
      return;
    }

    const { success: isVerify, message } = await verifyCaptcha();

    if (!isVerify) {
      alert(message);
      return;
    }

    setOpenedPayingPopup(true);
    setPaying(true);

    const ct = contract as any;
    const ctToken = contractToken as any;
    const coin = Number(usdc) * 1000000000000000000;

    const { signature, data }: any = await signatureContract({
      user: currentAccount,
      amount: coin,
      value: valueVoucher,
      emailorphone: email,
    });

    const { v, r, s }: any = signature;
    const { id, amount } = data;

    const success = await ct.methods
      .permit(currentAccount, id, amount, v, r, s)
      .call();
    if (success) {
      await ctToken.methods
        .approve(contractAddress, amount.toString())
        .send({ from: currentAccount });

      await ct.methods
        .buy(id, amount.toString(), v, r, s)
        .send({ from: currentAccount });
      console.log("scu");
    } else {
      console.log("fail");
    }
  };

  useEffect(() => {
    const { ethereum } = window as any;

    if (!ethereum) {
      alert("Please install metamask.");
      return;
    }

    ethereum.on("accountsChanged", function (accounts: any) {
      const [account] = accounts;
      setCurrentAccount(account);
    });
  }, []);

  useEffect(() => {
    async function fetchRateVND() {
      setRateVnd(10000);
    }

    fetchRateVND();
  }, []);

  const onClickVoucher = (voucher: any) => {
    setSelectVoucher(voucher.id);
    setValueVoucher(voucher.price);
    setDisplayInput(voucher.displayPrice);
    setUsdc(convertVNDToSHOD(voucher.price));
  };

  const showHideConnectionPopup = (ref: any, opened = false) => {
    const node = ref.current;
    if (opened) {
      if (node) {
        node.style.display = "block";
      }
    } else {
      if (node) {
        node.style.display = "none";
      }
    }
  };

  const onHandleConnectWallet = async () => {
    try {
      connectMetamask();
    } catch (error) {
      console.error(error);
    }
  };

  const onHandleBuying = async () => {
    if (!currentAccount) {
      setOpened(true);
      return;
    }

    await buyToken();
    console.log("Buyingggg voucher");
  };

  const notify = (message: any) => toast(message);

  useEffect(() => {
    showHideConnectionPopup(popupPaymentLoadingRef, openedPaying);
  }, [openedPaying]);

  useEffect(() => {
    showHideConnectionPopup(popConnectRef, opened);
  }, [opened]);

  return (
    <div className={style.root}>
      <ToastContainer />
      <div
        ref={popupPaymentLoadingRef as any}
        className="fixed hidden w-[100vw] h-[100vh] bg-[black] bg-opacity-40"
      >
        <div
          className={`fixed bg-white w-[350px] min-h-[450px] top-1/2 left-1/2 rounded-[4px] translate-x-[-50%] translate-y-[-50%]`}
        >
          <img
            onClick={() => setOpenedPayingPopup(false)}
            className={style["img-close"]}
            src="/multiply.png"
          />
          <p className="text-black font-medium text-[500] text-center py-[40px]">
            {isPaid ? "Giao dịch thành công" : "Đang xử lý giao dich"}
          </p>
          <div className={`${!isPaid ? "flex" : "hidden"} px-[8px] flex-row`}>
            <div className="border-solid border-[1px] h-[50px] w-[100%] border-[#666666]">
              <div className="w-1/2 h-[100%] bg-[#666] flex flex-row items-center justify-center">
                <span className="text-white font-medium">2 Phut</span>
              </div>
            </div>
          </div>
          <div className={`${isPaid ? "flex" : "hidden"} px-[8px] flex-row`}>
            <div className="border-solid border-[1px] h-[50px] w-[100%] border-[#666666]">
              <div className="w-[100%] h-[100%] bg-[#000] flex flex-row items-center justify-center">
                <span className="text-white font-medium">
                  <img src="/Done.png" />
                </span>
              </div>
            </div>
          </div>
          <p className="px-[37px] text-black text-[14px] font-normal text-center mt-[40px]">
            Vui lòng không tắt khi giao dịch đang hoàn tất. Chúng tôi sẽ gửi
            Voucher đến Email/Phone đến bạn khi giao dịch hoàn tất
          </p>
          <div className="flex flex-col mx-[9px] mt-[60px] gap-[16px] mb-[16px]">
            <a
              href={ethercanLink}
              target={"_blank"}
              className={`flex py-[14px] flex-row items-center justify-center rounded-[2px] border-solid border-[1px] ${
                isPaid
                  ? "border-black text-black cursor-pointer"
                  : "border-[#858585] text-[#858585] cursor-none"
              }  font-bold text-[16px] `}
            >
              Xem Thêm Trên Bsc Scan
            </a>
            <button
              onClick={() => setOpenedPayingPopup(false)}
              className={`${
                isPaid ? "bg-[#FDD116] text-black" : "bg-[#858585] text-white"
              } flex py-[14px] flex-row items-center justify-center rounded-[2px] font-bold text-[16px]`}
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      </div>
      <div
        ref={popConnectRef as any}
        className="fixed hidden w-[100vw] h-[100vh] bg-[black] bg-opacity-40"
      >
        <div className={style["popup-connect"]}>
          <img
            onClick={() => setOpened(false)}
            className={style["img-close"]}
            src="/multiply.png"
          />
          <p className={style.titleConnect}>Connect one of wallet</p>
          <div className={"flex flex-col"}>
            {connectionWallet.map((connection) => (
              <div
                key={connection.name}
                onClick={() => setWalletSelect(connection)}
                className="flex flex-row cursor-pointer justify-between border-[1px] items-center mx-[9px] py-[12px] px-[11px] border-solid border-wid border-[#E0E0E0]"
              >
                <div className="flex flex-row gap-2 items-center">
                  <img src={connection.src} />
                  <span className={style.connect_name}>{connection.name}</span>
                </div>
                <div>
                  <button
                    className={
                      (walletSelect as any).name === connection.name
                        ? style.popular_button
                        : style.popular_button_gray
                    }
                  >
                    Popular
                  </button>
                </div>
              </div>
            ))}
            <div className=" bg-[#fff] cursor-pointer border-[1px] border-solid border-[#a3a3a3] mx-[9px] py-[12px] px-[11px] flex justify-center items-center">
              <button className="text-center font-semibold text-[16px] text-[#858585]">
                View More
              </button>
            </div>
          </div>
          <div className="absolute w-[95%] left-[8px] bottom-[8px] ">
            <button
              onClick={() => onHandleConnectWallet()}
              className={style["button-connect-wallet"]}
            >
              Select Wallet
            </button>
          </div>
        </div>
      </div>

      <header className={style.header}>
        <div className="w-[30px]">
          <h3 className="font-bold text-[#fdd116] underline whitespace-nowrap cursor-pointer">
            {balance ? balance + " USDC" : ""}
          </h3>
        </div>

        <img
          src="/logo.png"
          onClick={() => {
            console.log("click-logo");
            reset();
          }}
        />
        <img onClick={() => {}} src="/menu.png" />
      </header>
      <main className="p-[16px]">
        <section
          className={`${
            isPaid ? "flex" : "hidden"
          } flex-col justify-center gap-[8px] items-center pt-20`}
        >
          <h3 className="text-white font-semibold text-[16px] text-center">
            Your voucher
          </h3>
          <h1 className="text-white text-[28px] font-medium text-center flex flex-row items-center gap-5 justify-center">
            {dataQRCode ? JSON.parse(dataQRCode).code : ""}
            <span>
              <img src="/doc.png" />
            </span>
          </h1>
          <QRCode value={dataQRCode} title={selectVoucher} level={"H"} />

          <a
            onClick={() => reset()}
            href={ethercanLink}
            target="_blank"
            className={style["button-buy-success"]}
          >
            Back
          </a>
        </section>
        <section className={`${isPaid ? "hidden" : ""}`}>
          <section className={style["section-buyer"]}>
            <span className={style["buyer-name-val"]}>
              Input the value voucher
            </span>
            <input
              pattern="[0-9]*"
              className={`hidden`}
              type="text"
              onChange={(e) => {
                const number = Number(e.target.value || 0);
                if (isNaN(number)) return;
                setValueVoucher(number);
                setUsdc(convertVNDToSHOD(number));

                const voucher = vouchers.find(
                  (voucher) => voucher.price === number
                );

                if (voucher) {
                  setSelectVoucher(voucher.id);
                } else {
                  setSelectVoucher("");
                }
              }}
              value={valueVoucher}
            ></input>
            <input
              pattern="[0-9]*"
              className={style["buyer-input"]}
              type="text"
              onChange={(e) => {
                let number = removeNumberWithCommas(e.target.value || "0");
                console.log(number);
                number = Number(number || 0);
                if (isNaN(number)) return;

                setValueVoucher(number);
                setDisplayInput(numberWithCommas(number));
                setUsdc(convertVNDToSHOD(number));

                const voucher = vouchers.find(
                  (voucher) => voucher.price === number
                );

                if (voucher) {
                  setSelectVoucher(voucher.id);
                } else {
                  setSelectVoucher("");
                }
              }}
              value={displayInput}
            ></input>

            <div className={style["list-voucher"]}>
              {vouchers.map((voucher: any) => (
                <div
                  key={voucher.id}
                  onClick={() => onClickVoucher(voucher)}
                  className={
                    style[
                      `item-voucher${
                        voucher.id === selectVoucher ? "-select" : ""
                      }`
                    ]
                  }
                >
                  {`${voucher.displayPrice} VND`}
                </div>
              ))}
            </div>
            <div className={style["buyer-name-val"]}>Send Voucher To:</div>
            <input
              className={style["buyer-input"]}
              type="text"
              value={email}
              placeholder=""
              onChange={(e) => setEmail(e.target.value || "")}
            ></input>

            <div className={style["title-price"]}>Payment Wallet</div>
            <h1 className={style["token-id"]}>{usdc} SHOD</h1>
            <span className={style["title-you"]}>
              <input
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                }}
                type="checkbox"
              />{" "}
              By clicking submit you agree to the terms and conditions
            </span>
            <button
              disabled={agree ? false : true}
              onClick={() => {
                onHandleBuying();
              }}
              className={style["button-buy"]}
            >
              Buy
            </button>
          </section>
        </section>
      </main>

      <section className="mt-[77.5px] p-[16px] border-t-gray-200 border-t-[1px] border-b-[1px] ">
        <img src="/logo-contact.png" />
        <div className="flex flex-col mt-[8px]">
          <div className="flex flex-row">
            <div className="w-[80px] text-left text-[#F4F6F8] text-[12px] font-normal whitespace-nowrap">
              Email
            </div>
            <div className="text-[#F4F6F8] text-[12px] font-normal">
              info@shopdi.ico
            </div>
          </div>
          <div className="flex flex-row">
            <div className="w-[80px] text-left text-[#F4F6F8] text-[12px] font-normal whitespace-nowrap">
              Website
            </div>
            <div className="text-[#F4F6F8] text-[12px] font-normal">
              http://www.shopdi.io/
            </div>
          </div>
          <div className="flex flex-row">
            <div className="w-[105px] text-left text-[#F4F6F8] text-[12px] font-normal whitespace-nowrap">
              Address
            </div>
            <div className="text-[#F4F6F8] text-[12px] font-normal">
              51 Yen The, Tan Binh District, Ho Chi Minh City, Vietnam
            </div>
          </div>
        </div>
        <div className="mt-[48px] flex flex-row gap-[22px]">
          <img src="/Facebook.png" />
          <img src="/Twitter.png" />
          <img src="/Instagram.png" />
          <img src="/LinkedIn.png" />
          <img src="/ytb.png" />
        </div>

        <div className="flex flex-row gap-[6px] mt-[8px] pb-[16px]">
          <img src="/app.png" />
          <img src="/google.png" />
        </div>
      </section>
      <footer className="flex items-center justify-center text-[12px] text-[#f4f8f6] py-[16px]">
        © 2022.Copyright by Shopdi
      </footer>
    </div>
  );
};

export default Home;
