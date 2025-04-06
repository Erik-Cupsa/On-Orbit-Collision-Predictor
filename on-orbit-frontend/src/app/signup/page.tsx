"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/footer/page';
import Csa from '@/components/csa/csa';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.email || errorData.message || "Something went wrong!");
                return;
            }

            alert("Sign up successful! Please log in to continue.");
            router.push('/login');
        } catch (err) {
            console.error("Signup error:", err);
            alert("An error occurred while signing up. Please try again.");
        }
    };

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className="w-full max-w-md m-auto flex flex-col gap-4">
                <h1 className="font-extrabold sm:text-[54px] text-[36px] sm:leading-[64px] leading-[46px] text-black">Sign Up</h1>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleSignUp}>
                    <div className="mb-2">
                        <label className="block text-black text-[16px] font-medium mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-black text-[16px] font-medium mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-black text-[16px] font-medium mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="shadow appearance-none bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-primary hover:bg-[#473198] text-white font-medium py-3 px-6 rounded-md text-[16px] focus:outline-none focus:shadow-outline"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
            {/* <Csa /> */}
            <Footer />
        </div>
    );
}