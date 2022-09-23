import { useRouter } from "next/router";

export default () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center">
      <div>Hello You are logged</div>
      <button className="px-20 py-5 text-white bg-orange-300 mt-5">
        Loggout
      </button>
    </div>
  );
};
