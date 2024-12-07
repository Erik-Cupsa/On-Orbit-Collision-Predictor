"use client"

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
    // we want to set this to true when session headers are present (user is logged in)
    const [isLoggedIn, setIsLoggedIn] = useState(false); 

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-lg font-bold">
                    <Link href="/">On Orbit Space Predictor</Link>
                </div>
                <div className="space-x-4 flex items-center">
                    <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                    <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
                    {!isLoggedIn && (
                        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}