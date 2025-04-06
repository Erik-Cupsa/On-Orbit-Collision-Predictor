"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Footer from '@/components/footer/page';
// import Csa from '@/components/csa/csa'; // Uncomment if needed

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

export default function UserPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No access token found. Please login.");
                router.push("/login");
                return;
            }
    
            try {
                const response = await fetch("http://localhost:8000/api/users/current_user/", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });
    
                if (!response.ok) {
                    if (response.status === 401) {
                        // Unauthorized – remove token and redirect
                        localStorage.removeItem('token');
                        router.push("/login");
                        return;
                    }
                    throw new Error("Failed to fetch user info.");
                }
    
                const data = await response.json();
                setUser(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };
    
        fetchUser();
    }, [router]);

    return (
        <div className="flex flex-col w-screen min-h-screen bg-gray-50">
            <div className="w-full max-w-md m-auto flex flex-col gap-4 p-6 bg-white rounded shadow-md mt-10">
                <h1 className="text-2xl font-bold text-black">Current User Info</h1>
                {loading ? (
                    <p>Loading user info...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : user ? (
                    <div className="space-y-2">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                        <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    </div>
                ) : (
                    <p>No user data available.</p>
                )}
            </div>
            <Footer />
        </div>
    );
}