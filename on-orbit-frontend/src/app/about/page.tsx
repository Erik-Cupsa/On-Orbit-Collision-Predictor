import Navbar from "@/components/Navbar";
import Footer from "@/components/footer/page";
import About from "@/components/about/about";
import Csa from "@/components/csa/csa";

export default function AboutPage() {
    return (
        <div className="flex flex-col w-screen h-screen">
            <Navbar />
            <About />
            <Csa />
            <Footer />
        </div>
    );
}