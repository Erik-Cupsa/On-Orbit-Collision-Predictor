import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full bg-slate-800 h-[40px]">
            <div className=" max-w-[90%] h-full m-auto w-full">
                <div className="flex h-full justify-between items-center gap-10">
                    <div className="text-gray-300">
                        <h1 className="text-white font-bold"></h1>
                    </div>
                    <div className="flex text-xs text-white gap-4">                
                        <p><Link href="/about" className="hover:text-white">About Us</Link></p>
                        <p><Link href="/contact" className="hover:text-white">Contact</Link></p>
                        <p><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></p>
                    
                    </div>
                </div>
            </div>
        </footer>
    );
}