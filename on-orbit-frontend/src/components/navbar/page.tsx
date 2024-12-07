import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-lg font-bold">
                    <Link href="/">On Orbit Space Predictor</Link>
                </div>
                <div className="space-x-4">
                    <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                    <Link href="/data" className="text-gray-300 hover:text-white">Data</Link>
                    <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
                </div>
            </div>
        </nav>
    );
}