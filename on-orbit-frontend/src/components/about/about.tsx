const About = () => {
    return (
        <div className="flex flex-col gap-4 h-full py-16 max-w-[70%] mx-auto">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-medium text-black">About Us</h1>
                <div className="flex flex-col gap-2">
                    <p className="text-lg text-gray-700 mb-4">
                        Welcome to the On-Orbit Collision Predictor. This project is a McGill Capstone project in collaboration with the Canadian Space Agency. Our goal is to provide accurate data on satellites in orbit and predict the probability of collisions to help ensure the safety and sustainability of space operations.
                    </p>
                    <p className="text-lg text-gray-700 mb-4">
                        Our team consists of dedicated students and professionals who are passionate about space and technology. We leverage advanced algorithms and data analysis techniques to deliver reliable predictions and insights.
                    </p>
                    <p className="text-lg text-gray-700 mb-4">
                        Thank you for visiting our site. If you have any questions or would like to learn more about our project, please feel free to contact us.
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-medium">Team</h1>
                <div className="flex gap-2">
                    <p>Erik</p>
                    <p>Masa</p>
                    <p>Wasif</p>
                    <p>Yassine</p>
                </div>
            </div>
        </div>
    )
}

export default About