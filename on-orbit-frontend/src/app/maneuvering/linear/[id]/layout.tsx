import { worksans } from "@/app/styles/font";
import Navbar from "@/components/Navbar";

export default function Layout({children} : Readonly<{children: React.ReactNode}>){
    return(
        <main className={`${worksans.className} flex flex-row`}>
            <Navbar />
            {children}
        </main>
    )
}