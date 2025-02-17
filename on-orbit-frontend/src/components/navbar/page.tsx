"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

import csaLogo from "@/assets/csa.png";
import mcgillLogo from "@/assets/mcgill.png";

export default function Navbar() {
    // we want to set this to true when session headers are present (user is logged in)
    const [isLoggedIn, setIsLoggedIn] = useState(false); 

    return (
        <nav className="w-full bg-background border-b-[3px] border-gray-700 h-[100px]">
            <div className='w-full flex justify-between items-center max-w-[70%] mx-auto py-6'>
                <Link href="/" className="flex items-center gap-4">
                    <div className='flex items-center justify-center gap-2'>
                        <Image src={csaLogo} alt="CSA Logo" width={60} height={60} />
                        <Image src={mcgillLogo} alt="McGill Logo" width={60} height={60} />
                    </div>
                    <div className='flex flex-col gap-1 text-gray-700 text-lg font-medium'>
                        <p>On Orbit Collision Predictor</p>
                        <p>Prédiction des Collisions en Orbite</p>
                    </div>
                    
                </Link>
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-black btn font-light btn-ghost">Home</Link>
                    <Link href="/about" className="text-black btn font-light btn-ghost">About</Link>
                    {!isLoggedIn && (
                        <Link href="/login" className="btn bg-gray-700 hover:bg-gray-800 px-10 text-white font-light border-none">Login</Link>
                    )}
                    {!isLoggedIn && (
                        <Link href="/signup" className="btn border hover:bg-gray-200 hover:border-gray-200 px-10 bg-white text-black font-light ">Sign Up</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}