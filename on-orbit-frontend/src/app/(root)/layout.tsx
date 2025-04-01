import Footer from "@/components/footer/page";
import Navbar from "../../components/Navbar";
import { worksans } from "../styles/font";
import Csa from "@/components/csa/csa";

export default function Layout({children} : Readonly<{children: React.ReactNode}>){
    return(
        <main className={`${worksans.className}`}>
            <Navbar />
            {children}
            <Csa/>
            <Footer />
        </main>
    )
}