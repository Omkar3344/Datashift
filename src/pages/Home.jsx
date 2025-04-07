import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileJson, 
  FileSpreadsheet, 
  ArrowRight, 
  Zap,
  Shield, 
  Cloud,
  FileUp
} from "lucide-react";
import { useAuth } from "../lib/context/AuthContext"; 
import Navbar from "../components/Navbar"; // Import the Navbar component

const Home = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  
  // Function to handle button clicks - updated to redirect to dashboard/feature1
  const handleConvertClick = (e) => {
    e.preventDefault();
    console.log("Button clicked, user status:", user ? "logged in" : "not logged in");
    
    if (user) {
      // If user is logged in, go directly to Dashboard with Feature1 selected
      console.log("Navigating to /dashboard/feature1");
      navigate("/dashboard/feature1");
    } else {
      // If not logged in, redirect to sign in page with dashboard/feature1 as return destination
      console.log("Navigating to /signin with returnTo = /dashboard/feature1");
      navigate("/signin", { state: { returnTo: "/dashboard/feature1" } });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Add Navbar at the top of the page */}
      <Navbar />
      
      {/* Main content container */}
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl md:text-6xl">
                Simple File Conversion
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                Convert between CSV, JSON, and Excel formats with just a few clicks.
                No registration required. Fast, secure, and free.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <button
                  onClick={handleConvertClick}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Start Converting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* File Format Icons Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-100">
                  <FileSpreadsheet className="h-10 w-10 text-black" />
                </div>
                <p className="mt-3 text-sm font-medium">CSV</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-100">
                  <ArrowRight className="h-10 w-10 text-gray-500" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-100">
                  <FileJson className="h-10 w-10 text-black" />
                </div>
                <p className="mt-3 text-sm font-medium">JSON</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-100">
                  <ArrowRight className="h-10 w-10 text-gray-500" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-100">
                  <FileSpreadsheet className="h-10 w-10 text-black" />
                </div>
                <p className="mt-3 text-sm font-medium">Excel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black">Key Features</h2>
              <p className="mt-4 text-lg text-gray-600">
                Our file converter makes data transformation simple and hassle-free
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="p-3 rounded-full bg-gray-100 inline-block mb-4">
                  <Zap className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-lg font-medium text-black">Fast Conversion</h3>
                <p className="mt-2 text-gray-600">
                  Convert your files instantly with our efficient processing engine.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="p-3 rounded-full bg-gray-100 inline-block mb-4">
                  <Shield className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-lg font-medium text-black">Secure Processing</h3>
                <p className="mt-2 text-gray-600">
                  Your files are processed securely and never stored on our servers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="p-3 rounded-full bg-gray-100 inline-block mb-4">
                  <Cloud className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-lg font-medium text-black">Cloud Storage</h3>
                <p className="mt-2 text-gray-600">
                  Sign in to save your converted files securely in the cloud.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black">How It Works</h2>
              <p className="mt-4 text-lg text-gray-600">
                Converting files is simple with our three-step process
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">1</div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-black">Upload Your File</h3>
                <p className="mt-2 text-gray-600">
                  Drag and drop or select your CSV, JSON, or Excel file
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">2</div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-black">Choose Output Format</h3>
                <p className="mt-2 text-gray-600">
                  Select the format you want to convert your file to
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">3</div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-black">Download Converted File</h3>
                <p className="mt-2 text-gray-600">
                  Get your file instantly or save it to the cloud
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-black">Ready to Convert Your Files?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Start using our file converter now - no sign up required for basic conversions.
            </p>
            <div className="mt-8">
              <button
                onClick={handleConvertClick}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <FileUp className="mr-2 h-5 w-5" />
                Convert Files Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-6 md:flex md:items-center md:justify-between">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} DataShift. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
