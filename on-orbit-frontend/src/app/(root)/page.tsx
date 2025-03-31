import Csa from "@/components/csa/csa";
import Landing from "@/components/landing/landing";
// import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col w-screen min-h-screen">
      <Landing />
      {/* <Csa /> */}
    </div>
  );
}