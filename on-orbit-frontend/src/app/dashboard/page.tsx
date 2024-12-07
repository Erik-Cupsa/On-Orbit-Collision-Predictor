import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";

export default function Dashboard() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-4 flex-grow">
                <section className="my-8">
                    <h2 className="text-2xl font-bold mb-4 text-black">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">User Information</h3>
                            <p className="text-gray-700">Name: John Doe</p>
                            <p className="text-gray-700">Email: john.doe@example.com</p>
                            {/* Add more user information as needed */}
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">Recent Activities</h3>
                            <p className="text-gray-700">Activity 1</p>
                            <p className="text-gray-700">Activity 2</p>
                            <p className="text-gray-700">Activity 3</p>
                            {/* Add more recent activities as needed */}
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">Other Data</h3>
                            <p className="text-gray-700">Placeholder for other data</p>
                            {/* Add more placeholders as needed */}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}