import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMoralis } from "react-moralis";

export default () => {
  const { isAuthenticated, logout } = useMoralis();
  const router = useRouter();

  const onHandleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div>Hello You are logged</div>
      <button
        className="px-20 py-5 text-white bg-orange-300 mt-5"
        onClick={onHandleLogout}
      >
        Loggout
      </button>
    </div>
  );
};
