from collections import defaultdict

import numpy as np

import re
import os
import httpx
import requests as nrequests

from typing import List, Dict, Tuple


from dotenv import load_dotenv

load_dotenv()


HF_TOKEN = os.getenv("HF_TOKEN")  # store your Hugging Face token in env
headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

API_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert"
text1 = "You are such a loser. Nobody likes you."

#response = httpx.post(API_URL, headers=headers, json=payload)
#print(response.json())

#----------------------------------------------------------funcitons for toxicity------------------------

def evaluate_toxicity(text):

    payload={"inputs": text}
    results = httpx.post(API_URL, headers=headers, json=payload)
    return results.json()[0][0]['score']


print(evaluate_toxicity(text1))


print("below is demarcation line\n\n")



#run once and copy from .cache/xxxx to path 

#model_path = os.getenv("NER_MODEL_PATH", "./model_cache/huggingface/models--dslim--bert-base-NER/snapshots/d1a3e8f13f8c3566299d95fcfc9a8d2382a9affc")
#model_path = "./model_cache/huggingface/models--dslim--bert-base-NER/snapshots/d1a3e8f13f8c3566299d95fcfc9a8d2382a9affc"
#ner_pipeline = pipeline("ner", model=model_path, aggregation_strategy="simple")
#ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")

#ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")

load_dotenv()

API_URL = "https://api-inference.huggingface.co/models/dslim/bert-base-NER"


text2="""President Trump announced smart phones, chips, and computers are exempt from the 145% tariffs on 
goods from China.Subscribe to ABC News on YouTube: https://abcnews.visitlink.me/59aJ1G ABC News Digital 
is your daily source of breaking national and world news, exclusive interviews and 24/7 live streaming 
coverage.Download the ABC News app for the latest headlines and alerts: https://abcnews.go.com/devices 
Watch 24/7 coverage of breaking news and live events on ABC News Live:    •
 LIVE: Latest News Headlines and Event...Watch full episodes of World News Tonight with David Muir here:  
   • ABC World News Tonight with David Mui...Read ABC News reports online: http://abcnews.go.com ABC News
    is the home to the #1 evening newscast “World News Tonight” with David Muir, “Good Morning America,” “20/20,” 
    “Nightline,” “This Week” with George Stephanopoulos, ABC News Live Prime 
    with Linsey Davis, plus the daily news podcast “Start Here.” Connect with ABC News on social media
    """

def run_ner(text: str):
    payload = {"inputs": text}
    response = nrequests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

entities=run_ner(text2)
#print(entities)


entity_dict = defaultdict(int)
for e in entities:
    print(e)
    key=(e['word'],e['entity_group'])
    entity_dict[key] += 1

topn_entities = sorted(entity_dict.items(), key=lambda item: item[1], reverse=True)[0:6]


#ner_scores = [NERScore(entity_group=group, entity=word, count=v) for (word,group), v in topn_entities]

ner_scores = [(group, word, v) for (word,group), v in topn_entities]

print(ner_scores)
