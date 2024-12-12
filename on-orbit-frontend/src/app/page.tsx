import Csa from "@/components/csa/csa";
import Footer from "@/components/footer/page";
import Landing from "@/components/landing/landing";
import Navbar from "@/components/navbar/page";
// import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col w-screen min-h-screen">
      <Navbar />
      <Landing />
      <Csa />
      <Footer />
    </div>
  );
}