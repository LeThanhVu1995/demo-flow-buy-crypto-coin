import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useMoralis, useWeb3Transfer } from "react-moralis";
import style from "./home.module.css";
import { contractAddress, usdcAbi } from "./constants/const";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCode from "react-qr-code";

const convertVNDToUSDC = (vnd: number) => {
  return vnd / 200000;
};

const connectionWallet = [
  {
    name: "Metamask",
    src: "/metamask.png",
    options: {},
    popular: true,
  },
  // {
  //   name: "Coinbase",
  //   src: "/coinbase.png",
  //   options: {},
  //   popular: false,
  // },
  // {
  //   name: "WallConnect",
  //   src: "/wallconnect.png",
  //   options: { provider: "walletconnect" },
  //   popular: false,
  // },
  // {
  //   name: "Phantom",
  //   src: "/phantom.png",
  //   options: { type: "sol" },
  //   popular: false,
  // },
];

const vouchersData = [
  {
    id: "ABCDEF",
    price: 1000000,
  },
  {
    id: "FBCDEF",
    price: 3000000,
  },
  {
    id: "YYCDEF",
    price: 5000000,
  },
  {
    id: "AFADEF",
    price: 15000000,
  },
  {
    id: "ABLKEF",
    price: 20000000,
  },
  {
    id: "ABCEEEF",
    price: 25000000,
  },
];

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
  const [mintValue, setMintValue] = useState("");
  const [ethercanLink, setEtherscanLink] = useState("");
  const [walletSelect, setWalletSelect] = useState({});

  const onClickVoucher = (voucher: any) => {
    setSelectVoucher(voucher.id);
    setValueVoucher(voucher.price);
    setUsdc(convertVNDToUSDC(voucher.price));
  };

  const {
    authenticate,
    Moralis,
    isWeb3Enabled,
    isAuthenticated,
    logout,
    user,
  } = useMoralis();

  async function fetchData(account: any) {
    const options = {
      contractAddress: contractAddress,
      functionName: "balanceOf",
      abi: usdcAbi,
      params: {
        account: account,
      },
    };

    if (isWeb3Enabled) {
      const response = await Moralis.executeFunction(options);
      console.log(response.toString());
      setBalance(response.toString());
    }
  }
  useEffect(() => {
    return () => {
      window.addEventListener("beforeunload", async (ev) => {
        ev.preventDefault();
        await logout();
      });
    };
  }, []);

  useEffect(() => {
    fetchData(currentAccount);
  }, []);

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

  const onHandleLogout = async () => {
    await logout();
    setBalance("");
  };

  const onHandleConnectWallet = async (options: any) => {
    try {
      const user = await authenticate(options);
      console.log(user?.get("ethAddress"));
    } catch (error) {
      console.error(error);
    }
  };

  const onHandleMintValue = async () => {
    if (!isAuthenticated) {
      setOpened(true);
      return;
    }

    if (Number(mintValue) <= 0) {
      notify("Enter your USDC to exchange");
      return;
    }

    const amount = ethers.BigNumber.from(mintValue);
    const price = ethers.BigNumber.from("100000000000000");
    const calcPrice = amount.mul(price);

    console.log(contractAddress, amount, price, calcPrice);

    let options: any = {
      contractAddress: contractAddress,
      functionName: "mint",
      abi: usdcAbi,
      msgValue: calcPrice,
      params: {
        amount,
      },
    };
    const transaction: any = await Moralis.executeFunction(options);
    const receipt = await transaction.wait();

    if (receipt) {
      setMintValue("0");
      fetchData(currentAccount);
      notify("Exchange token success.");
    }
  };

  const onHandleBuying = async () => {
    if (!isAuthenticated) setOpened(true);

    if (isAuthenticated) {
      try {
        if (Number(usdc) < 1) {
          notify("Minimum price voucher is 1 USDC");
          return;
        }

        if (Number(usdc) > Number(balance)) {
          notify("You are not enough USDC to buy voucher");
          return;
        }

        const amount = ethers.BigNumber.from(usdc);

        const options: any = {
          type: "erc20",
          amount: amount,
          receiver: contractAddress,
          contractAddress: contractAddress,
        };

        const transaction: any = await Moralis.transfer(options);
        setPaying(true);
        setOpenedPayingPopup(true);
        const receipt = await transaction.wait();

        if (receipt) {
          console.log(receipt);
          setPaying(false);
          setIsPaid(true);
          setEtherscanLink(
            `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`
          );
          fetchData(currentAccount);
        }
      } catch (err: any) {
        console.error(err);
        setOpenedPayingPopup(false);
        setPaying(false);
        setIsPaid(false);
        notify(err.message);
      }
    }
  };

  const notify = (message: string) => toast(message);

  useEffect(() => {
    if (isAuthenticated) {
      if (Moralis.User.current()) {
        setCurrentAccount(user?.get("ethAddress") || user?.get("solAddress"));
        fetchData(user?.get("ethAddress") || user?.get("solAddress"));
      }
      setOpened(false);
    } else {
      setCurrentAccount("");
    }
  }, [isAuthenticated]);

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
          <div className="flex flex-col mx-[9px] mt-[60px] gap-[16px]">
            <a
              href={ethercanLink}
              target={"_blank"}
              className={`flex py-[14px] flex-row items-center justify-center rounded-[2px] border-solid border-[1px] ${
                isPaid
                  ? "border-black text-black cursor-pointer"
                  : "border-[#858585] text-[#858585] cursor-none"
              }  font-bold text-[16px] `}
            >
              Xem Trên Ethercan
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
                <div className="flex flex-row gap-2">
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
              onClick={() =>
                onHandleConnectWallet((walletSelect as any).options)
              }
              className={style["button-connect-wallet"]}
            >
              Kết nối Ví (Connect Wallet)
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

        <img src="/logo.png" />
        <img onClick={() => onHandleLogout()} src="/menu.png" />
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
            ABSDASDSS
            <span>
              <img src="/doc.png" />
            </span>
          </h1>
          <QRCode value={selectVoucher} title={selectVoucher} />
          <a
            href={ethercanLink}
            target="_blank"
            className={style["button-buy"]}
          >
            Xem Thêm Trên Etherum Scan
          </a>
          <a
            href={ethercanLink}
            target="_blank"
            className={style["button-buy"]}
          >
            Sử dụng token trên App Shopdi
          </a>
        </section>
        <section className={`${isPaid ? "hidden" : ""}`}>
          <section className={style.sectionBrand}>
            <h1 className={style["brand-title"]}>Buy Voucher</h1>
            <h2 className={style["brand-description"]}>
              Shopdi is an ecommerce platform specializing in high-end products
              as well as limited edition items. Participating in game
              application activities, buyers will have the right to decide to
              buy trendy products at the desired price without affecting the
              seller's profit.
            </h2>
          </section>
          <section className={style["section-buyer"]}>
            <span className={style["buyer-name-val"]}>
              Input the value voucher
            </span>
            <input
              className={style["buyer-input"]}
              type="text"
              onChange={(e) => {
                const number = Number(e.target.value || 0);
                setValueVoucher(number);
                setUsdc(convertVNDToUSDC(number));

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
                  {`${voucher.price} VND`}
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
            <h1 className={style["token-id"]}>{usdc} USDC</h1>
            <span className={style["title-you"]}>[*] You.</span>
            <button
              onClick={() => {
                onHandleBuying();
              }}
              className={style["button-buy"]}
            >
              Buy
            </button>
            <span className={style["buyer-name-val"]}>
              Enter your token USDC exchange:
            </span>
            <input
              className={style["buyer-input"]}
              type="text"
              placeholder="0"
              onChange={(e) => {
                setMintValue(e.target.value);
              }}
              value={mintValue}
            ></input>
            <button
              onClick={() => {
                onHandleMintValue();
              }}
              className={style["button-buy"]}
            >
              Exchange Token
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
            <div className="w-[90px] text-left text-[#F4F6F8] text-[12px] font-normal whitespace-nowrap">
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
          <img src="/Youtube.png" />
        </div>

        <h5 className="text-[#F4F6F8] font-normal text-[14px] mt-[28px]">
          Download the app on your phone
        </h5>

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
