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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Example satellite data cards */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-xl font-bold mb-2">Satellite 1</h3>
              <p className="text-gray-700">Position: (X, Y, Z)</p>
              <p className="text-gray-700">Velocity: (Vx, Vy, Vz)</p>
              <p className="text-gray-700">Other data...</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-xl font-bold mb-2">Satellite 2</h3>
              <p className="text-gray-700">Position: (X, Y, Z)</p>
              <p className="text-gray-700">Velocity: (Vx, Vy, Vz)</p>
              <p className="text-gray-700">Other data...</p>
            </div>
            {/* Add more satellite data cards as needed */}
          </div>
        </section>

        <section className="my-8">
          <h2 className="text-2xl font-bold mb-4">Collision Probability Prediction</h2>
          <p className="text-gray-700 mb-4">
            Our advanced algorithms predict the probability of collisions between satellites. Stay informed about potential risks and take necessary precautions to avoid collisions.
          </p>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-bold mb-2">Prediction Example</h3>
            <p className="text-gray-700">Satellite 1: Satellite 1 Name</p>
            <p className="text-gray-700">Satellite 2: Satellite 2 Name</p>
            <p className="text-gray-700">Probability of Collision: 0.01%</p>
            <p className="text-gray-700">Time to Impact: 2 hours</p>
            {/* Add more prediction details as needed */}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}