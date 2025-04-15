from flask import Flask, request, jsonify
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
import re
import os
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd
import httpx

load_dotenv()  # Looks for .env in current directory


#import logging
#logging.basicConfig(level=logging.DEBUG)


app = Flask(__name__)
#CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all routes
CORS(app) #simplified





def reg_parse(line):
  pattern=r'\*\*(.+?)\*\*\s*:\s*(\d+(?:\.\d+)?)\s*\((.*?)\)'
  match = re.search(pattern, line)
  if match:
    category = match.group(1)  # "Illegal content"
    score = match.group(2)     # "0.2"
    context = match.group(3)
    return category, score, context
  else:
    return None,None,None


def parse_evaluation(text):
    eval_result=[]
    for line in text.split("\n"):
        if ":" in line:
            key, value, reason =reg_parse(line)
            if(key != None):
                eval_result.append({"cat":key.strip().lower(), "score":float(value.strip()),"reason":reason})
    return eval_result

def deepseek_score(text):

  message=f"""Given the input text below:
     text: {text}

  please evaluate the scores(0-1) of the below ten dimension regarding the risks:

  Jailbreaking,
  Illegal content,
  Hateful content,
  Harassment,
  Racism,
  Sexism,
  Violence,
  Sexual content,
  Harmful content,
  Unethical content

  Give score(0-1) for each category in the following format and each category will be in one line:
  **category**: score (reason) """
    
  DEEPSEEK_API_URL = "https://api.deepseek.com"
  DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY") #"sk-"

  if not DEEPSEEK_API_KEY:
        raise ValueError("API key is missing. Set DEEPSEEK_API_KEY in Vercel.")

  os.environ.pop("HTTP_PROXY", None)
  os.environ.pop("HTTPS_PROXY", None)

  http_client = httpx.Client()
  
  client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_API_URL,http_client=http_client)

  response = client.chat.completions.create(
      model="deepseek-chat",messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": message},
    ],
        temperature=0,         # Most important for determinism (0-1)
        top_p=1,               # Use with temperature=0
        max_tokens=500,        # Sufficient for your response format
        seed=42,               # Fixed random seed
        frequency_penalty=0,
        presence_penalty=0)
  
  score_result=[]
  score_result=parse_evaluation(response.choices[0].message.content)
  print(score_result)
  return score_result


@app.route('/api/grc', methods=['POST','OPTIONS'])
def analyze_text():
     # Add this check at the start
    if request.path != '/api/grc':
        return jsonify({"error": "Invalid path"}), 400
        
    if request.method == 'OPTIONS':
        # Handle preflight requests
        response = jsonify({"success": True})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response


    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        scores = deepseek_score(text)
        #logging.debug(f"API Response: {scores}")

        if not scores:
            return jsonify({"error": "No valid scores generated"}), 500
        return jsonify({"success": True, "records":scores})
    except Exception as e:
        return jsonify({"success":False, "error": str(e)}), 500


# Vercel requires a function named `handler`
# Comment below for inspection
#handler = WsgiToAsgi(app)

# Vercel-specific handler
'''def vercel_handler(request):
    with app.app_context():
        response = app.full_dispatch_request()(request)
        return response
'''

#the below is not necessary for serverless in 

#asgi_app = WsgiToAsgi(app)  # Expose the ASGI handler

# Vercel requires a function named 'handler'
#handler = WsgiToAsgi(app)

'''if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)   #comment it for local test
    #import uvicorn        # for local test
    # for local test
    #uvicorn.run("grc:handler", host="0.0.0.0", port=5000, reload=True)
'''

# for testing purpose

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)



'''if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)   #comment it for local test
    #import uvicorn        # for local test
    # for local test
    #uvicorn.run("grc:handler", host="0.0.0.0", port=5000, reload=True)
'''



