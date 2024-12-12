"use client"

import { useState } from 'react';
// import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/page';
import Footer from '@/components/footer/page';
import Csa from '@/components/csa/csa';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // const router = useRouter();

    const handleSignUp = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
    
        // Basic validation
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
    
        try {
            // Replace with your backend API endpoint for user signup
            const response = await fetch("https://your-backend-api.com/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });
    
            if (!response.ok) {
                // Handle HTTP errors
                const errorData = await response.json();
                alert(`Error: ${errorData.message || "Something went wrong!"}`);
                return;
            }
    
            // Assuming the response contains user info or a success message
            const data = await response.json();
            alert("Sign up successful! Welcome to the platform.");
    
            // Redirect to login page or dashboard
            // Example: Navigate to login page (use React Router or another method)
            // navigate("/login");
    
        } catch (error) {
            // Handle network or unexpected errors
            console.error("Signup error:", error);
            alert("An error occurred while signing up. Please try again.");
        }
    };

    return (
        <div className="flex flex-col w-screen h-screen">
            <Navbar />
            <div className='w-full max-w-md m-auto flex flex-col gap-4'>
                <h1 className='text-6xl font-medium text-gray-700'>Sign Up</h1>
                <form onSubmit={handleSignUp}>
                    <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-2">
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
                    <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
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
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirm-password">
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
                            className="bg-green-900 hover:bg-green-950 text-white font-light py-3 px-6 rounded-md text-xl focus:outline-none focus:shadow-outline"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
            <Csa />
            <Footer />
        </div>
    );
}