// app/solution/page.jsx
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';

import { 
  Gauge,         // Explanability icon
  Scale,         // Bias & Fairness icon
  BrainCircuit,  // Hallucination icon
  TrendingUp,    // Driftness icon
  Layers,        // Distillation icon
  GanttChart,    // Monitoring icon
  Shield,        // Security icon
  Puzzle         // Integration icon
} from 'lucide-react';

const solutions = [
  {
    id: 'ai-gcr',
    title: "AI Governance, Compliance & Risk (GCR)",
    description: "Comprehensive framework for responsible AI deployment",
    image: "/images/solution-ai-gcr.jpg",
    cta: "/solution/ai-gcr",
    topics: [
      {
        name: "Explanability",
        icon: <Gauge className="w-6 h-6 text-blue-600" />,
        description: "Transparent AI decisions"
      },
      {
        name: "Bias & Fairness",
        icon: <Scale className="w-6 h-6 text-blue-600" />,
        description: "Mitigate system biases"
      },
      {
        name: "Hallucination",
        icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
        description: "Reduce false information"
      },
      {
        name: "Driftness",
        icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
        description: "Track performance changes"
      }
    ]
  },
     {
    id: 'llmop',
    title: "LLM Operations (LLMOp)",
    description: "Optimize large language model performance, reduce costs, and streamline deployment",
    image: "/images/solution-ai-llmop.jpg",
    cta: "/solution/llmop",
    topics: [
      {
        name: "Distillation & Fine-Tune",
        icon: <Layers className="w-6 h-6 text-blue-600" />,
        description: "Model optimization for efficience and capability"
      },
      {
        name: "Explanability & Observability",
        icon: <GanttChart className="w-6 h-6 text-blue-600" />,
        description: "Turn Blackbox logic to explanable reasoning"
      },
      {
        name: "Security & Protection",
        icon: <Shield className="w-6 h-6 text-blue-600" />,
        description: [
    "Defending against risk and prevent the data leakage"
  ] // Newline separated
      },
      {
        name: "Business Integration",
        icon: <Puzzle className="w-6 h-6 text-blue-600" />,
        description: "Seamless application interoperablility"
      }
    ]
  },
  {
    id: 'ai-visual-recognition',
    title: "AI Visual Recognition",
    description: "Advanced computer vision solutions for real-time object detection and analysis. Our visual recognition technology delivers industry-leading accuracy across multiple applications.",
    image: "/images/solution-ai-vision.jpg",
    cta: "/solution/ai-visual-recognition"
  }
//add more solution here
];

export default function SolutionsOverview() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20 space-y-16">
        {solutions.map((solution, index) => (
          <div 
            key={solution.id}
            className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
          >
            {/* Image Column */}
            <div className="w-full md:w-2/5 h-80 relative rounded-xl overflow-hidden shadow-lg">
              <Image
                src={solution.image}
                alt={solution.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Text Column */}
            <div className="w-full md:w-3/5 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">{solution.title}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {solution.description}
              </p>

              {/* Topics Grid for solutions that have them */}
              {solution.topics && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {solution.topics.map((topic) => (
                      <div 
                        key={topic.name} 
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                      >
                        <div className="p-2 bg-blue-50 rounded-full mb-2">
                          {topic.icon}
                        </div>
                        <h3 className="!text-sm font-semibold">{topic.name}</h3>
                        <p className="!text-[12px] text-gray-500 mt-1 whitespace-pre-line text-left">{topic.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Link
                      href={solution.cta}
                      className="px-6 py-2 bg-blue-600 !text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Explore Solution
                    </Link>
                  </div>
                </>
              )}

              {/* Regular button for solutions without topics */}
              {!solution.topics && (
                <Link
                  href={solution.cta}
                  className="inline-block mt-6 px-8 py-3 bg-blue-600 !text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Explore Solution
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    <Layout/> 
    </div>
  );
}