import Link from "next/link"

const Landing = () => {
    return (

        <>
            <section className="w-full bg-primary min-h-[530px] flex justify-center items-center flex-col py-10 px-6">
                <h1 className={`uppercase bg-black text-white px-6 py-3 font-extrabold sm:text-[54px] text-[36px] sm:leading-[64px] leading-[46px] max-w-5xl text-center my-5`}>Predict Satellite Collisions, <br /> Protect Space Assets</h1>
                <p className="font-medium text-[20px] text-white text-center break-words !max-w-3xl">Monitor orbits in real-time, assess collision risks, and evaluate maneuvers to keep your missions safe and sustainable.</p>
                <Link href="/login">
                    <button className="button mt-10">
                        <p className="button__text">
                            <span style={{ '--index': 0 } as React.CSSProperties}>C</span>
                            <span style={{'--index': 1} as React.CSSProperties}>H</span>
                            <span style={{'--index': 2} as React.CSSProperties}>E</span>
                            <span style={{'--index': 3} as React.CSSProperties}>C</span>
                            <span style={{'--index': 4} as React.CSSProperties}>K</span>
                            <span style={{'--index': 5} as React.CSSProperties}> </span>
                            <span style={{'--index': 6} as React.CSSProperties}> </span>
                            <span style={{'--index': 7} as React.CSSProperties}>D</span>
                            <span style={{'--index': 8} as React.CSSProperties}>A</span>
                            <span style={{'--index': 9} as React.CSSProperties}>S</span>
                            <span style={{'--index': 10} as React.CSSProperties}>H</span>
                            <span style={{'--index': 11} as React.CSSProperties}>B</span>
                            <span style={{'--index': 12} as React.CSSProperties}>O</span>
                            <span style={{'--index': 13} as React.CSSProperties}>A</span>
                            <span style={{'--index': 14} as React.CSSProperties}>R</span>
                            <span style={{'--index': 15} as React.CSSProperties}>D</span>
                            <span style={{'--index': 16} as React.CSSProperties}> </span>
                            <span style={{'--index': 17} as React.CSSProperties}> </span>
                        </p>
                        <div className="button__circle">
                            <svg
                            viewBox="0 0 14 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="button__icon"
                            width="14"
                            >
                            <path
                                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                                fill="currentColor"
                            ></path>
                            </svg>

                            <svg
                            viewBox="0 0 14 15"
                            fill="none"
                            width="14"
                            xmlns="http://www.w3.org/2000/svg"
                            className="button__icon button__icon--copy"
                            >
                            <path
                                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                                fill="currentColor"
                            ></path>
                            </svg>
                        </div>
                    </button>
                </Link>
            </section>

            <section className="px-6 py-10 max-w-7xl mx-auto">
                <p className="text-[30px] font-extrabold">Features</p>
                <div className="grid md:grid-cols-2 grid-cols-1 gap-5 mt-7">
                    <div className="rounded-[22px] border-[5px] gap-5 py-6 px-5 shadow-md hover:border-primary border-black transition-all duration-500 hover:shadow-lg">
                        <h1 className="text-[26px] font-medium">Satellite Data Explorer</h1>
                        <p className="text-[16px] font-normal my-3">Gain access to a comprehensive database of satellites currently in orbit. This feature provides detailed information, including:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li className="text-[16px]">
                                <span className="font-medium block">Positions:</span>
                                <span className="block">Real-time or predicted locations of satellites.</span>
                            </li>
                            <li className="text-[16px]">
                                <span className="font-medium block">Velocities:</span>
                                <span className="block">Current speeds and directions.</span>
                            </li>
                            <li className="text-[16px]">
                                <span className="font-medium block">Orbital Parameters:</span>
                                <span className="block">Data essential for understanding satellite behavior.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="rounded-[22px] border-[5px] gap-5 py-6 px-5 shadow-md hover:border-primary border-black transition-all duration-500 hover:shadow-lg">
                        <h1 className="text-[26px] font-medium">Collision Probability Prediction</h1>
                        <p className="text-[16px] font-normal my-3">Leverage advanced algorithms to predict the likelihood of collisions between satellites. This feature helps:</p>
                        {/* <ul className="space-y-1 font-light list-disc list-inside">
                            <li className="font-normal text-[15px]"><span className="font-medium text-[16px]">Identify Potential Risks:</span> Highlight high-risk events based on real-time and historical data.</li>
                            <li className="font-normal text-[15px]"><span className="font-medium text-[16px]">Support Decision-Making:</span> Assist operators in planning orbital maneuvers to avoid collisions.</li>
                            <li className="font-normal text-[15px]"><span className="font-medium text-[16px]">Promote Sustainability:</span> Contribute to reducing space debris by preventing unnecessary collisions.</li>
                        </ul> */}
                        <ul className="list-disc pl-5 space-y-2">
                            <li className="text-[16px]">
                                <span className="font-medium block">Identify Potential Risks:</span>
                                <span className="block">Highlight high-risk events based on real-time and historical data.</span>
                            </li>
                            <li className="text-[16px]">
                                <span className="font-medium block">Support Decision-Making:</span>
                                <span className="block">Assist operators in planning orbital maneuvers to avoid collisions.</span>
                            </li>
                            <li className="text-[16px]">
                                <span className="font-medium block">Promote Sustainability:</span>
                                <span className="block">Contribute to reducing space debris by preventing unnecessary collisions.</span>
                            </li>
                        </ul>

                    </div>
                </div>
            </section>

            <section className="px-6 w-full max-w-7xl mx-auto mb-20">
                <p className="text-[30px] mb-7 font-extrabold">Get Started</p>
                <div className="rounded-[22px] border-[5px] gap-5 py-6 px-5 shadow-md hover:border-primary border-black transition-all duration-500 hover:shadow-lg">
                    <div className="space-y-2">
                        <p className="text-[16px] font-normal">Access the On-Orbit Collision Predictor and take control of orbital safety.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li className="text-[16px]"><span className="font-medium">New User?</span> <Link href="/signup" className="underline font-semibold">Sign up</Link> to create your account and unlock all features.</li>
                            <li className="text-[16px]"><span className="font-medium">Returning User?</span> <Link href="login" className="underline font-semibold">Log in </Link>to continue exploring satellite data and receiving collision risk insights.</li>
                        </ul>
                        <p className="text-[16px] font-normal">Your journey to safer space operations starts here!</p>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Landing