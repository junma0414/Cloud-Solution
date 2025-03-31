'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import './page.module.css'; // Import the CSS
import Layout from '../../components/Layout';

// Content data for each solution with multiple slides
const solutions = {
  'ai-gcr': {
    title: "AI Governance, Compliance & Risk (GCR)",
    description: "Comprehensive AI auditing for ethical compliance and risk mitigation.",
    image: "/images/solution-ai-gcr.jpg",
    slides: [
      "/images/solution-ai-gcr-1.png",
      "/images/solution-ai-gcr-2.png",
      "/images/solution-ai-gcr-3.png"
    ],
    features: [
      "Regulatory compliance checks",
      "Bias and fairness analysis",
      "Risk assessment frameworks"
    ],
    sellingPoints: [
      "One Stop LLM Monitoring Platform",
      "Drilling Down to unveil the story behind surface",
      "Comprehensive risk scoring",
      "Customizable frameworks for industry-specific requirements"
    ],
    cta: "/solutions/ai-gcr/details"
  },
  'llmop': {
    title: "LLM Operations (LLMOp)",
    description: "Optimize large language model deployment and monitoring.",
    image: "/images/solution-ai-llmop.jpg",
    slides: [
      "/images/solution-ai-llmop-1.png",
      "/images/solution-ai-llmop-2.png",
      "/images/solution-ai-llmop-3.png"
    ],
    features: [
      "Model performance tracking",
      "Cost optimization",
      "API integration support"
    ],
    sellingPoints: [
      "Reduce LLM operational costs by up to 60%",
      "Monitor model performance in real-time",
      "Automated scaling based on demand",
      "Integrated security and access controls",
      "Detailed usage analytics and reporting"
    ],
    cta: "/solutions/llmop/details"
  },
  'ai-visual-recognition': {
    title: "AI Visual Recognition",
    description: "Cutting-edge computer vision for object detection and analysis.",
    image: "/images/solution-ai-vision.jpg",
    slides: [
      "/images/solution-ai-vision.jpg"
    ],
    features: [
      "Real-time image processing",
      "Custom model training",
      "Multi-platform SDKs"
    ],
    sellingPoints: [
      "99.8% accuracy in object recognition",
      "Process images 5x faster than competitors",
      "Custom-trained models for your specific needs",
      "Seamless integration with existing systems",
      "Edge computing support for low-latency applications"
    ],
    cta: "/solutions/ai-visual-recognition/details"
  }
};

export default function SolutionPage() {
  const params = useParams();
  const slug = params?.slug;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [solution, setSolution] = useState({
    title: "",
    description: "",
    slides: [],
    features: [],
    sellingPoints: [],
    cta: ""
  });

  useEffect(() => {
    if (slug && solutions[slug]) {
      setSolution(solutions[slug]);
    } else {
      setSolution({
        title: "Solution Not Found",
        description: "This solution does not exist.",
        slides: [],
        features: [],
        sellingPoints: [],
        cta: "/solutions"
      });
    }
  }, [slug]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content with Slides and Selling Points */}
      <section className="py-10 mt-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Slides Container - Takes 2/3 width on larger screens */}
            <div className="w-full md:w-2/3">
              {solution.slides.length > 0 ? (
                <>
                  <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-xl bg-white p-4">
                    {solution.slides.map((image, index) => (
                      <div 
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-center p-4 ${
                          index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${solution.title} - Slide ${index + 1}`}
                          width={800}
                          height={450}
                          className="object-contain w-full h-full"
                          priority={index === currentSlide}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Slider Dots */}
                  <div className="mt-6 flex justify-center space-x-3">
                    {solution.slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlideChange(index)}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                          index === currentSlide ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg shadow-xl flex items-center justify-center">
                  <p className="text-gray-500 text-lg">No slides available</p>
                </div>
              )}
            </div>

            {/* Selling Points - Takes 1/3 width on larger screens */}
            <div className="w-full md:w-1/3">
              <div className="bg-white p-6 rounded-lg shadow-lg h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {solution.title === "Solution Not Found" ? "Error" : "What We Can Offer"}
                </h2>
                {solution.sellingPoints.length > 0 ? (
                  <ul className="space-y-4">
                    {solution.sellingPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-blue-100 text-s text-blue-600 rounded-full p-1 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">{solution.description}</p>
                )}
                
                {slug === 'ai-visual-recognition' ? (
                  <button 
                    className="mt-8 bg-gray-400 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed w-full"
                    disabled
                  >
                    Coming Soon...
                  </button>
                ) : (
                  solution.cta && (
                    <div className="mt-8">
                      <Link 
                        href="/contact" 
                        className="bg-blue-600 hover:bg-blue-700 !text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 block text-center"
                      >
                        {/*solution.title === "Solution Not Found" ? "Back to Solutions" : "Contact Us"*/}
                        Contact us
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Solutions Navigation */}
      {solution.title !== "Solution Not Found" && (
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Explore Other Solutions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(solutions).map(([key, item]) => (
                <Link 
                  href={`/solution/${key}`} 
                  key={key}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition hover:-translate-y-1"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                  <h3 className="text-xl font-bold mt-4 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 mt-2">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <Layout />
    </div>
  );
}