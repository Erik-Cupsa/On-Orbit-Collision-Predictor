import Link from 'next/link';

export default function Footer() {
    return (

        <footer className="w-full bg-slate-800 py-2">
            <div className="w-full max-w-7xl px-6 m-auto text-white h-full space-y-4">
        {/* <footer className="w-screen bg-slate-800 py-2">
            <div className="h-full bg-pink-400 mx-6 max-w-7xl w-full m-auto"> */}
                <div className="flex justify-between items-center gap-10">
                    <div className="">
                        <h1 className="text-white font-bold"></h1>
                    </div>
                    <div className="flex text-white gap-4">                
                        <p><Link href="/about" className="hover:text-white">About Us</Link></p>
                        <p><Link href="/contact" className="hover:text-white">Contact</Link></p>
                        <p><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></p>
                    
                    </div>
                </div>
            </div>
        </footer>
    );
}