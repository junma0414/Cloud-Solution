//app/solution/[slug]/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import './page.module.css';
import Layout from '../../components/Layout';

// Content data for each solution with multiple slides
const solutions = {
  'llmtrack': {
    title: "AI-LLM continuity, responsibility and risk-detection",
    description: "A delegant framework to understand your communications with your clients, in order to keep business continutity, reduce model risk and behave responsibly",
    image: "/images/solution-ai-gcr.jpg",
    slides: [
      "/images/home-1.png",
      "/images/drift-ner-1.png",
      "/images/table-1.png",
 "/images/hallucination-1.png",
      "/images/flow-1.png"
    ],
    features: [
      "API call overview",
      "Model Stability Tracking",
      "Enable you locate the specific prompts/responses",
      "hallucination benchmarking",
      "reconstruct your session flow"
    ],
    sellingPoints: [
      "You want to have a overview on the API calls. So here is the summaized stats by project , model and days",
      "Stability and driftness usually are the first set metrics to monitor. You can track the drift trend and Entities pattern ",
      "You can inspect the specif prompts/response call by drilling down from a date or an entity",
      "The response might behave unexpectely. Hallucination will help you to check what might be wrong, given a certain input",
     "You can further re-construct the session scenarios along with the call details"
    ],
    cta: "/solutions/ai-gcr/details"
  },
  'llmop': {
    title: "LLM Operations (LLMOp)",
    description: "A integrated simulation platform to share artifects among team by streamlining deployment of Language Model, lightweighted Inputs creation, instance inference execution with outcomes inspection.",
    image: "/images/solution-ai-llmop.jpg",
    slides: [
      "/images/model-1.png",
      "/images/model-2.png",
      "/images/data-1.png",
  "/images/inference-1.png",
      "/images/inference-2.png"
    ],
 
    features: [
      "Model Management",
      "Model deployed as service",
      "A lightweighted way of input creation",
      "Easy inference",
      "Instant outcome inspection"
    ],
    sellingPoints: [
      "You and your team have a fine-tuned or distilled model, and you will like to take this one-stop to cross-sharing the model artifects",
      "By uploading model artifacts, an endpoint will be published by default. Thus the model is not a silo, but serve as a service",
      "You can easily generate and upload the prompts as input, either a single text or a batch of them",
      "Model, Data are ready. You just need adjust the paramets applicable to your model type, and here we 'Run Inference'",
      "All the inference history are kept on the records. Just view it"
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
  const featureRefs = useRef([]);

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

  const scrollToFeature = (index) => {
    featureRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
   {/* Hero Section with Text Background */}
<section className="relative h-screen max-h-[800px] flex items-center justify-center overflow-hidden">
  <div className="absolute inset-0 bg-black/30 z-10"></div>
  {solution.slides.length > 0 && (
    <Image
      src={solution.image} 
      alt={solution.title}
      fill
      className="object-cover"
      priority
    />
  )}
  
  {/* Text Container with Transparent Background */}
  <div className="container mx-auto px-6 relative z-20">
    <div className="bg-black/40 p-8 rounded-lg max-w-4xl mx-auto"> {/* Added transparent bg */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
        {solution.title}
      </h1>
      
      <p className="text-xl md:text-2xl !text-white max-w-3xl mx-auto mb-8 leading-relaxed">
        {solution.description}
      </p>
      
      <div className="flex justify-center">
        <button 
          onClick={() => scrollToFeature(0)}
          className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-all duration-300"
        >
          Explore Features
        </button>
      </div>
    </div>
  </div>
</section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
         
          
          <div className="space-y-32">
            {solution.features.map((feature, index) => (
              <div 
                key={index}
                ref={el => featureRefs.current[index] = el}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}
              >
                <div className="w-full md:w-1/2">
                  {solution.slides[index] ? (
                    <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                      <Image
                        src={solution.slides[index % solution.slides.length]}
                        alt={feature}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <p className="text-gray-500">Visual coming soon</p>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-1/2">
                  <div className="text-5xl font-bold text-gray-300 mb-4">0{index + 1}</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature}</h3>
                  <p className="text-gray-600 text-lg">
                    {solution.sellingPoints[index] || "Detailed description of this feature coming soon."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* Three-Row Centered CTA Section */}
<section className="py-12 bg-gradient-to-r from-blue-600 to-blue-800">
  <div className="container mx-auto px-6">
    <div className="flex flex-col items-center space-y-3 pb-4">
      {/* Row 1: Heading */}
      <h2 className="text-2xl font-bold text-white text-center">
        Ready to transform your business?
      </h2>
      
      {/* Row 2: Description */}
      <section className="text-lg !text-white/90 text-center">
        Get started with our {solution.title} solution today.
      </section>
      
      {/* Row 3: Button */}
      <div className="pt-2">
        {slug === 'ai-visual-recognition' ? (
          <button 
            className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-full hover:bg-blue-50 transition-all duration-300 whitespace-nowrap text-sm"
            disabled
          >
            Coming Soon...
          </button>
        ) : (
          <Link 
            href="/contact" 
            className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-full hover:bg-blue-50 transition-all duration-300 whitespace-nowrap text-sm"
          >
            Reach Our Experts
          </Link>
        )}
      </div>
    </div>
  </div>
</section>

      <Layout />
    </div>
  );
}