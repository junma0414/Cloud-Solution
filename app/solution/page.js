// app/solution/page.jsx
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';

import { 
  Gauge, Scale, BrainCircuit, TrendingUp,
  Layers, FileText, ServerCog, Puzzle
} from 'lucide-react';

const solutions = [
  {
    id: 'ai-gcr',
    title: "AI-LLM continuity, responsibility and risk-detection",  
    description: "A delegant framework to understand your communications with your clients, in order to keep business continutity, reduce model risk and behave responsibly",
    image: "/images/solution-ai-gcr.jpg",
    cta: "/solution/llmtrack",
    topics: [
      { name: "Entity Recognization", icon: <Gauge className="w-6 h-6 text-blue-600" />, description: "Investigate the key terms" },
      { name: "Bias & Fairness", icon: <Scale className="w-6 h-6 text-blue-600" />, description: "Mitigate system biases" },
      { name: "Hallucination", icon: <BrainCircuit className="w-6 h-6 text-blue-600" />, description: "Reduce false information" },
      { name: "Driftness", icon: <TrendingUp className="w-6 h-6 text-blue-600" />, description: "Track performance changes" }
    ]
  },
  {
    id: 'llmop',
    title: "LLM Operations (LLMOp)",
    description: "A integrated simulation platform to share artifects among team by streamlining deployment of Language Model, lightweighted Inputs creation, instance inference execution with outcomes inspection",
    image: "/images/solution-ai-llmop.jpg",
    cta: "/solution/llmop",
    topics: [
      { name: "Share and deploy your LLMs", icon: <Layers className="w-6 h-6 text-blue-600" />, description: "Publish models for better accessibility" },
      { name: "Manage your source inputs", icon: <FileText className="w-6 h-6 text-blue-600" />, description: "Prepare your prompts randomly or in a batch" },
      { name: "Inference with self-defined parameters", icon: <ServerCog className="w-6 h-6 text-blue-600" />, description: "Model Inference while managing parameters" },
      { name: "Business Integration", icon: <Puzzle className="w-6 h-6 text-blue-600" />, description: "Seamless application interoperablility" }
    ]
  },
  {
    id: 'ai-visual-recognition',
    title: "AI Visual Recognition",
    description: "Advanced computer vision solutions for real-time object detection and analysis. Our visual recognition technology delivers industry-leading accuracy across multiple applications.",
    image: "/images/solution-ai-vision.jpg",
    cta: "/solution/ai-visual-recognition"
  }
];

export default function SolutionsOverview() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Obserpedia AI Solutions",
    "url": "https://www.obserpedia.com/solution",
    "description": "Overview of AI monitoring, governance, and operations solutions by Obserpedia.",
    "hasPart": solutions.map((s) => ({
      "@type": "SoftwareApplication",
      "name": s.title,
      "url": `https://www.obserpedia.com${s.cta}`,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": s.description,
      "publisher": { "@type": "Organization", "name": "Obserpedia" }
    }))
  };

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
              <p className="text-lg text-gray-600 leading-relaxed">{solution.description}</p>

              {solution.topics && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {solution.topics.map((topic) => (
                      <div key={topic.name} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                        <div className="p-2 bg-blue-50 rounded-full mb-2">{topic.icon}</div>
                        <h3 className="!text-sm font-semibold">{topic.name}</h3>
                        <p className="!text-[12px] text-gray-500 mt-1 whitespace-pre-line text-left">{topic.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Link href={solution.cta} className="px-6 py-2 bg-blue-600 !text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
                      Explore Solution
                    </Link>
                  </div>
                </>
              )}

              {solution.id === 'ai-visual-recognition' ? (
                <button disabled className="inline-block mt-6 px-8 py-3 bg-gray-400 !text-white font-medium rounded-lg cursor-not-allowed">
                  Coming Soon
                </button>
              ) : !solution.topics && (
                <Link href={solution.cta} className="inline-block mt-6 px-8 py-3 bg-blue-600 !text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Explore Solution
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <Layout />

      {/* ✅ Structured Data (server-rendered for Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}
