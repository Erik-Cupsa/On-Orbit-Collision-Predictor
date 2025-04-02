"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { worksans } from '@/app/styles/font';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedName = localStorage.getItem('username'); // Assume you store username after login
        if (token) {
            setIsLoggedIn(true);
            if (storedName) setUsername(storedName);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        router.push('/');
    };

    return (
        <div className={` bg-white ${worksans.className}`}>
            {pathname !== "/dashboard" && (
                <nav className="px-5 py-3 shadow-sm flex justify-between items-center">
                    {isLoggedIn ? (
                        <Link href="/dashboard" className='flex items-center gap-2'>
                            <Image src="/logo.png" alt="logo" width={172.8} height={36} />
                        </Link>
                    ) : (
                        <Link href="/" className='flex items-center gap-2'>
                            <Image src="/logo.png" alt="logo" width={172.8} height={36} />
                        </Link>
                    )}
                    
                    

                    <div className="flex items-center gap-5 text-black">
                        <Link href="/about">About</Link>
                        {isLoggedIn ? (
                            <>
                                <button onClick={handleLogout}>Logout</button>
                                {/* <Link href="/profile">
                                    <span>{username || "Profile"}</span>
                                </Link> */}
                            </>
                        ) : (
                            <>
                                {pathname !== "/login" && (
                                    <Link href="/login">
                                        <button>Login</button>
                                    </Link>
                                )}
                                {pathname !== "/signup" && (
                                    <Link href="/signup">
                                        <button>Sign Up</button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </nav>
            )}
            {pathname === "/dashboard" && (
                <div className='flex h-screen'>
                    <nav className="w-[250px] flex-shrink-0 fixed left-0 top-0 h-screen border-r pl-5 pr-10 py-5 bg-white z-10 flex flex-col justify-between">
                        {isLoggedIn ? (
                            <Link href="/dashboard" className='flex items-center gap-2'>
                                <Image src="/logo.png" alt="logo" width={172.8} height={36} />
                            </Link>
                        ) : (
                            <Link href="/" className='flex items-center gap-2'>
                                <Image src="/logo.png" alt="logo" width={172.8} height={36} />
                            </Link>
                        )}
                        
                        

                        <div className="flex flex-col w-full items-start justify-center gap-5 text-black">
                            <Link href="/about">About</Link>
                            {isLoggedIn ? (
                                <>
                                    <button onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                <>                                
                                    <Link href="/signup">
                                        <button>Sign Up</button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </div>
    );
}
