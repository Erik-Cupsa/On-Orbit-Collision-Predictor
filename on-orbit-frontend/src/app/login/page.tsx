"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/page';
import Footer from '@/components/footer/page';
import Csa from '@/components/csa/csa';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();

            localStorage.setItem('token', data.access_token);
            
            router.push('/dashboard');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        }
    };

    return (

        <div className="flex flex-col w-screen h-screen">
            <Navbar />
            <div className='w-full max-w-md m-auto flex flex-col gap-8'>
                <h1 className='text-6xl font-medium text-gray-700'>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
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
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-green-900 hover:bg-green-950 text-white font-light py-3 px-6 rounded-md text-xl focus:outline-none focus:shadow-outline"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
            <Csa />
            <Footer />
        </div>
    );
}