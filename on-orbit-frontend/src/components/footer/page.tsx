import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-800 p-4 mt-8">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-gray-300">
                    <h4 className="text-white font-bold">Company</h4>
                </div>
                <div className="text-gray-300">
                    <h4 className="text-white font-bold">The Team</h4>
                    <ul>
                        <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}