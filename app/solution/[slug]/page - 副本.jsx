// app/solution/[slug]/page.jsx
import Image from 'next/image';
import Link from 'next/link';
import './page.module.css'; // Import the CSS

// Content data for each solution
const solutions = {
  'ai-gcr': {
    title: "AI Governance, Compliance & Risk (GCR)",
    description: "Comprehensive AI auditing for ethical compliance and risk mitigation.",
    image: "/images/solution-ai-gcr.jpg", // Replace with your image path
    features: [
      "Regulatory compliance checks",
      "Bias and fairness analysis",
      "Risk assessment frameworks"
    ],
    cta: "/solutions/ai-gcr/details" // Further navigation
  },
  'llmop': {
    title: "LLM Operations (LLMOp)",
    description: "Optimize large language model deployment and monitoring.",
    image: "/images/solution-ai-llmop.jpg",
    features: [
      "Model performance tracking",
      "Cost optimization",
      "API integration support"
    ],
    cta: "/solutions/llmop/details"
  },
  'ai-visual-recognition': {
    title: "AI Visual Recognition",
    description: "Cutting-edge computer vision for object detection and analysis.",
    image: "/images/solution-ai-vision.jpg",
    features: [
      "Real-time image processing",
      "Custom model training",
      "Multi-platform SDKs"
    ],
    cta: "/solutions/ai-visual-recognition/details"
  }
};

export default function SolutionPage({ params }) {
  const { slug } = params;
  const solution = solutions[slug] || {
    title: "Solution Not Found",
    description: "This solution does not exist."
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">{solution.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {solution.description}
          </p>
        </div>
      </section>

      {/* Image + Text Section */}
      <section className="py-16">
        <div className="container mx-auto px-3">
          <div className="flex flex-col md:flex-row items-center gap-5 mb-20">
            <div className="md:w-3/5">
              <Image
                src={solution.image}
                alt={solution.title}
                width={300}
                height={200}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Key Features</h2>
              <ul className="space-y-4">
                {solution.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={solution.cta}
                className="mt-8 inline-block px-6 py-3 bg-blue-500  rounded-lg hover:bg-blue-400 !text-white font-bold transition"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Solutions Navigation */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Explore Other Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(solutions).map(([key, item]) => (
              <Link 
                href={`/solution/${key}`} 
                key={key}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                 <Image
    src={item.image}
    alt={item.title}
     width={400}
                height={250}
                className="solution card rounded-lg shadow-xl"
  />
                <h3 className="text-xl font-bold mt-4">{item.title}</h3>
                <p className="text-gray-600 mt-2">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}