import Navbar from "../../components/Navbar";
import { worksans } from "../styles/font";

export default function Layout({children} : Readonly<{children: React.ReactNode}>){
    return(
        <main className={`${worksans.className} flex flex-row`}>
            <Navbar />
            {children}
        </main>
    )
}