import Link from "next/link"

const Csa = () => {
    return(
        <div className="w-screen bg-slate-700 py-5">
            <div className="w-full max-w-[70%] m-auto text-white h-full space-y-4">
                <h1 className="text-lg">Canadian Space Agency</h1>
                <div className="flex w-full gap-48">
                    <Link href="https://www.asc-csa.gc.ca/eng/contact.asp">
                        <p className="hover:underline text-sm font-light">Contact the&nbsp;
                            <span className="underline">CSA</span>
                        </p>
                    </Link>
                    <Link href="https://www.asc-csa.gc.ca/eng/about/">
                        <p className="hover:underline text-sm font-light">About the&nbsp;
                            <span className="underline">CSA</span>
                        </p>
                    </Link>
                    <Link href="https://www.asc-csa.gc.ca/eng/terms.asp">
                        <p className="hover:underline text-sm font-light">Notices and copyright</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Csa