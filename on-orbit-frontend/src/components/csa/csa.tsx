import Link from "next/link"

const Csa = () => {
    return(
        <div className="w-full bg-slate-900 py-4">
            <div className="w-full max-w-7xl px-6 m-auto text-white h-full space-y-4">
                <h1 className="text-[16px] font-medium">Canadian Space Agency</h1>
                <div className="flex w-full gap-48">
                    <Link href="https://www.asc-csa.gc.ca/eng/contact.asp">
                        <p className="hover:underline text-sm font-normal">Contact the&nbsp;
                            <span className="underline">CSA</span>
                        </p>
                    </Link>
                    <Link href="https://www.asc-csa.gc.ca/eng/about/">
                        <p className="hover:underline text-sm font-normal">About the&nbsp;
                            <span className="underline">CSA</span>
                        </p>
                    </Link>
                    <Link href="https://www.asc-csa.gc.ca/eng/terms.asp">
                        <p className="hover:underline text-sm font-normal">Notices and copyright</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Csa