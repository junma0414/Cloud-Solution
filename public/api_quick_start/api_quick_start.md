---
title: "Text Risk Scoring API"
date: 2025-02-15
---
# Text Risk Scoring API
---
Last Updated time：2025-03-04 22:39:46

### Description
This API wil receive the input text, and return ten categories of scores.

**domain**

http://obserpedia.com/


**route(path)**

/api/v1/grc_api


### Parameters
|Name |Type |Mandatory |Description |Sample Value
|------ |------ |------ |------ |------ |
|method |String |Yes |API Interface Name |/api/v1/<method name> |
|api_key |String |Yes |api_key for the usage |sk_12345678987654321 |
|text |String |Yes |the text for the risk analysis | |
|project_name |String |No |you can define in the post body or eliminate it. |"dummy project" | 
|model_name |String |No |you can define in the post body or eliminate it. |"dummy model" | 
|session_id |String |No |it is to specify the session between assistant and clients | |
|session_dialog_id |String |No |it is to specify a particular dialog(text) duing the session | |
|session_dialog_dt |timestamp(with timezone) |Yes |the time when the session_dialog happen |2025-01-08 23:51:24.328243+08:00 or in simple form 2025-01-08 23:51:24+08. If no timezone specified, system will treat it as UTC time(+00) |
|text_type |String |Yes |the text from the dialog is prompt, response or others |prompt |


### Post examples
</br>

**cURL**

Note:You will need add or remove backward slash in accordance with OS where your console is running
```
curl -X POST "https://www.obserpedia.com/api/v1/grc_api" -H "x-api-key: <your_api_key>" -H "Content-Type: application/json" -d "{\"text\":\"This is my last warning and the bad fortune will come to you when the countdown starts\", \"project_name\":\"ner project1\",\"model_name\":\"ner model1\",\"session_id\":\"12345\", \"session_dialog_id\":\"12345-5\", \"session_dialog_dt\": \"2025-01-08 23:51:29+07\", \"text_type\":\"response\"}"


```
</br>

**Python with Post**
```
import requests
import json

url = "https://www.obserpedia.com/api/v1/grc_api"
headers = {
    "x-api-key": "<your_api_key>",
    "Content-Type": "application/json"
}
data = {
    "text": "This is my last warning and the bad fortune will come to you when the countdown starts",
    "project_name": "My Project",
    "model_name":"My Model",
    "session_id":"12345",
    "session_dialog_id":"12345-1",
    "session_dialog_dt":"2025-01-08 23:51:29+07",
    "text_type":"response"
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

const url = 'https://www.obserpedia.com/api/v1/grc_api';
const headers = {
    'x-api-key': '<your_api_key>',
    'Content-Type': 'application/json'
};
const data = {
    text: 'This is my last warning',
    project_name: 'My Project',
    model_name:'My Model',
    session_id:'12345',
    session_dialog_id:'12345-1',
    session_dialog_dt:'2025-01-08 23:51:29+07',
    text_type:'response'
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
Success: {
  success: true,
  result: [
    {
      cat: 'jailbreaking',
      score: 0,
      reason: 'The text does not attempt to bypass or undermine any system restrictions.'
    },
    {
      cat: 'illegal content',
      score: 0,
      reason: 'The text does not promote or describe illegal activities.'
    },
    {
      cat: 'hateful content',
      score: 0,
      reason: 'There is no language targeting any group or individual with hate.'
    },
    {
      cat: 'harassment',
      score: 0,
      reason: 'The text is not directed at anyone in a threatening or repetitive manner.'
    },
    {
      cat: 'racism',
      score: 0,
      reason: 'No racial slurs, stereotypes, or discriminatory language is present.'
    },
    {
      cat: 'sexism',
      score: 0,
      reason: 'The text does not contain gender-based discrimination or derogatory remarks.'
    },
    {
      cat: 'violence',
      score: 0,
      reason: 'No explicit or implicit threats or glorification of violence.'
    },
    {
      cat: 'sexual content',
      score: 0,
      reason: 'No explicit or suggestive sexual language.'
    },
    {
      cat: 'harmful content',
      score: 0.2,
      reason: 'While not overtly harmful, a "last warning" could imply a threat depending on context, but the text alone is vague.'
    },
    {
      cat: 'unethical content',
      score: 0,
      reason: 'No manipulation, deception, or unethical persuasion is evident.'
    }
  ],
  error: null,
  request_id: '6d0991e8-3be3-4829-8b86-77d22569c8d3'
}
```

</br>

### Return Code

 






