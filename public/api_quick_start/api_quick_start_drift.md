---
title: "Drift Scoring API"
date: 2025-02-16
---
# Drift Scoring API
---
Last Updated time：2025-03-04 22:39:46

### Description
This API wil receive the input text, and return three type of scores:
- text readability 

Based on Flesch Reading Ease Score， there is readability in pair with difficulty level and education level
|Score |Readability Level |Education Level |
|------ |------ |------ |
|90–  |Very Easy |5th grade |
|80–90 |Easy |th grade |
|70–80 |Fairly Easy |7th grade |
|60–70 |Standard |8th–9th grade |
|50–60 |Fairly Difficult |10th–12th grade |
|30–50 |Difficult |College student |
|0–30 |Very Difficult  |College graduate level |
- text stopwords-ratio
- text toxicity score

**domain**

http://obserpedia.com/


**route(path)**

/api/v1/drift


### Parameters
|Name |Type |Mandatory |Description |Sample Value
|------ |------ |------ |------ |------ |
|method |String |Yes |API Interface Name |/api/v1/<method name> |
|api_key |String |Yes |api_key for the usage |sk_12345678987654321 |
|text |String |Yes |the text for the scoring analysis | |
|project_name |String |No |you can define in the post body or eliminate it. |"dummy project" | 
|model_name |String |No |you can define in the post body or eliminate it. |"dummy model" | 


### Post examples
</br>

**cURL**

Note:You will need add or remove backward slash in accordance with OS where your console is running
```
curl -L -X POST "http://obserpedia.com/api/v1/drift" \
-H "x-api-key: <your_api_key>" \
-H "Content-Type: application/json" \
-d "{\"text\":\"This is my last warning\", \"project_name\":\"my demo project\", \"model name\":\"my demo model\"}"


```
</br>

**Python with Post**
```
import requests
import json

url = "https://obserpedia.com/api/v1/drift"
headers = {
    "x-api-key": "<your_api_key>",
    "Content-Type": "application/json"
}
data = {
    "text": "This is my last warning",
    "project_name": "My Project",
    "model_name":"My Model"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    response.raise_for_status()  # Raises exception for 4XX/5XX responses
    print("Response:", response.json())
except requests.exceptions.RequestException as e:
    print("Error making request:", e)
```
</br>

**Nodejs**


```
const axios = require('axios');

const url = 'https://obserpedia.com/api/v1/drift';
const headers = {
    'x-api-key': '<your_api_key>',
    'Content-Type': 'application/json'
};
const data = {
    text: 'This is my last warning',
    project_name: 'My Project',
    model_name:'My Model'
};

axios.post(url, data, { headers })
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        console.error('Error making request:', error.response?.data || error.message);
    });
```

</br>


### Sample Response
```
{"success":true,"readability":100.24000000000002,"toxicity":0.54,"stopwords_ratio":0.6,"request_id":"0e768af8-1941-4c8a-b623-89e8cfa0eccc"}
```

</br>

### Return Code

 






