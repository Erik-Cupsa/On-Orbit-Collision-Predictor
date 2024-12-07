import Footer from "@/components/footer/page";
import Navbar from "@/components/navbar/page";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        <section className="text-center my-8">
          <h1 className="text-4xl font-bold mb-4">On-Orbit Collision Predictor</h1>
          <p className="text-lg text-gray-700">
            Welcome to the On-Orbit Collision Predictor, a McGill Capstone project in collaboration with the Canadian Space Agency. Our app provides data on satellites in orbit and predicts the probability of collisions.
          </p>
        </section>

        <section className="my-8">
          <h2 className="text-2xl font-bold mb-4">Satellite Data</h2>
          <p className="text-gray-700 mb-4">
            Explore detailed data on various satellites currently in orbit. Our database includes information on satellite positions, velocities, and other relevant parameters.
          </p>
        </section>

        <section className="my-8">
          <h2 className="text-2xl font-bold mb-4">Collision Probability Prediction</h2>
          <p className="text-gray-700 mb-4">
            Our advanced algorithms predict the probability of collisions between satellites. Stay informed about potential risks and take necessary precautions to avoid collisions.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}