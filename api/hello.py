from flask import Flask, request, jsonify
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
import re
import os
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all routes

@app.route('/api/hello', methods=['POST', 'OPTIONS'])
def hello():
    """Test endpoint to verify API is working."""
    if request.method == 'OPTIONS':
        # Handle preflight requests
        response = jsonify({"success": True})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    data = request.get_json()
    text = data.get('text', '')
    return jsonify({"message": f"{text} API working!"})

'''
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
'''
