"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import csaLogo from "@/assets/csa.png";
import mcgillLogo from "@/assets/mcgill.png";
import { useRouter } from 'next/navigation';

export default function Navbar() {
    // we want to set this to true when session headers are present (user is logged in)
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        router.push('/');
    };

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
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard" className="text-black btn font-light btn-ghost">Dashboard</Link>
                            <button onClick={handleLogout} className="text-black btn font-light btn-ghost">Logout</button>
                        </>
                    ) : (
                        <div>
                            <Link href="/login" className="text-black btn font-light btn-ghost">Login</Link>
                            <Link href="/signup" className="text-black btn font-light btn-ghost">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}