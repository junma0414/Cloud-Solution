from quart import Quart, request, jsonify
from quart_cors import cors
import re
import os
from openai import OpenAI
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Quart(__name__)
app = cors(app, allow_origin="*")  # Enable CORS

def reg_parse(line):
    pattern = r'\*\*(.+?)\*\*\s*:\s*(\d+(?:\.\d+)?)\s*\((.*?)\)'
    match = re.search(pattern, line)
    if match:
        return match.group(1).strip(), float(match.group(2)), match.group(3)
    return None, None, None

def parse_evaluation(text):
    eval_result = []
    for line in text.split("\n"):
        if ":" in line:
            key, value, reason = reg_parse(line)
            if key is not None:
                eval_result.append({
                    "cat": key.lower(),
                    "score": value,
                    "reason": reason
                })
    return eval_result

#for testing, just run 'set DEEPSEEK_API_KEY=<api_key>'
async def deepseek_score(text):
    message = f"""Given the input text below:
    text: {text}

    Please evaluate the scores(0-1) of the below ten dimensions regarding the risks:
    Jailbreaking, Illegal content, Hateful content, Harassment,
    Racism, Sexism, Violence, Sexual content, Harmful content,
    Unethical content

    Give score(0-1) for each category in the following format:
    **category**: score (reason)"""

    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    if not DEEPSEEK_API_KEY:
        raise ValueError("API key is missing. Set DEEPSEEK_API_KEY in Vercel.")

    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": message},
        ],
        temperature=0,
        max_tokens=500,
        seed=42
    )

    content = response.choices[0].message.content
    logger.debug(f"Raw API response: {content}")
    return parse_evaluation(content)

@app.route('/api/grc', methods=['POST'])
async def analyze_text():
    try:
        data = await request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        scores = await deepseek_score(text)
        logger.debug(f"Generated scores: {scores}")

        if not scores:
            return jsonify({"error": "No valid scores generated"}), 500
            
        return jsonify({
            "records": scores,
            "count": len(scores)
        })
    except Exception as e:
        logger.error(f"Error in analyze_text: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Vercel needs this named 'app' for ASGI
app = app

#python -m quart --app grc:app run --port 5000 --reload