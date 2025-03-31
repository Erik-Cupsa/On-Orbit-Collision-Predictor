import Navbar from "@/components/Navbar"

export default function Loading() {
    return (
        <>
            <Navbar/>
            <div className="flex flex-col items-center justify-center h-screen">
                {/* <span className="loading loading-spinner loading-lg"></span> */}
                <div className="spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </> 
    );
  }