import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";

export default function About() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-4 flex-grow">
                <section className="my-8">
                    <h1 className="text-4xl font-bold mb-4 text-black">About Us</h1>
                    <p className="text-lg text-gray-700 mb-4">
                        Welcome to the On-Orbit Collision Predictor. This project is a McGill Capstone project in collaboration with the Canadian Space Agency. Our goal is to provide accurate data on satellites in orbit and predict the probability of collisions to help ensure the safety and sustainability of space operations.
                    </p>
                    <p className="text-lg text-gray-700 mb-4">
                        Our team consists of dedicated students and professionals who are passionate about space and technology. We leverage advanced algorithms and data analysis techniques to deliver reliable predictions and insights.
                    </p>
                    <p className="text-lg text-gray-700 mb-4">
                        Thank you for visiting our site. If you have any questions or would like to learn more about our project, please feel free to contact us.
                    </p>
                </section>
            </main>
            <Footer />
        </div>
    );
}