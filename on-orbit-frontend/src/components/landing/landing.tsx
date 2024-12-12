import Link from "next/link"

const Landing = () => {
    return (
        <div className="flex flex-col gap-8 h-full max-w-[70%] w-full m-auto justify-center items-center py-16">
            <section className="flex flex-col gap-4 w-full">
                <div className="space-y-3">
                    <h1 className="text-5xl font-medium text-gray-700">On-Orbit Collision Predictor</h1>
                    <div className="w-16 h-[6px] bg-orange-800"></div>
                </div>
                <p className="text-lg font-light">
                Welcome to the On-Orbit Collision Predictor, a cutting-edge McGill Capstone project developed in collaboration with the Canadian Space Agency. This project aims to enhance space safety and sustainability by providing accurate, real-time insights into the risk of satellite collisions in orbit.
                </p>
            </section>

            <section className="flex flex-col gap-6 text-start w-full text-black text-lg">
                <h1 className="text-3xl font-medium text-gray-700">Features</h1>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h1 className="text-xl font-medium text-gray-700">Satellite Data Explorer</h1>
                        <p className="text-lg font-light">Gain access to a comprehensive database of satellites currently in orbit. This feature provides detailed information, including:</p>
                        <ul className="space-y-1 font-light list-disc list-inside">
                            <li><span className="font-medium">Positions:</span> Real-time or predicted locations of satellites.</li>
                            <li><span className="font-medium">Velocities:</span> Current speeds and directions.</li>
                            <li><span className="font-medium">Orbital Parameters:</span> Data essential for understanding satellite behavior.</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-medium text-gray-700">Collision Probability Prediction</h1>
                        <p className="text-lg font-light">Leverage advanced algorithms to predict the likelihood of collisions between satellites. This feature helps:</p>
                        <ul className="space-y-1 font-light list-disc list-inside">
                            <li><span className="font-medium">Identify Potential Risks:</span> Highlight high-risk events based on real-time and historical data.</li>
                            <li><span className="font-medium">Support Decision-Making:</span> Assist operators in planning orbital maneuvers to avoid collisions.</li>
                            <li><span className="font-medium">Promote Sustainability:</span> Contribute to reducing space debris by preventing unnecessary collisions.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-6 text-start w-full text-black text-lg">
                <h1 className="text-3xl font-medium text-gray-700">Get Started</h1>
                <div className="space-y-2">
                    <p className="text-lg font-light">Access the On-Orbit Collision Predictor and take control of orbital safety.</p>
                    <ul className="space-y-1 font-light list-disc list-inside">
                        <li><span className="font-medium">New User?</span> <Link href="/signup" className="underline">Sign up</Link> to create your account and unlock all features.</li>
                        <li><span className="font-medium">Returning User?</span> <Link href="login" className="underline">Log in </Link>to continue exploring satellite data and receiving collision risk insights.</li>
                    </ul>
                    <p className="text-lg font-light">Your journey to safer space operations starts here!</p>
                </div>
            </section>
        </div>
    )
}

export default Landing