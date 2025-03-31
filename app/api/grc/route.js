export async function POST(req) {
  const { text } = await req.json();

  // Mock analysis logic (Replace with real API logic)
  const categories = [
    "Jailbreaking",
    "Illegal content",
    "Hateful content",
    "Harassment",
    "Racism",
    "Sexism",
    "Violence",
    "Sexual content",
    "Harmful content",
    "Unethical content",
  ];

  const scores = categories.reduce((acc, category) => {
    acc[category] = Math.random(); // Mock score (Replace with model logic)
    return acc;
  }, {});

  return Response.json({ scores });
}