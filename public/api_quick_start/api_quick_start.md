---
title: "Text Risk Scoring API"
date: 2025-02-15
---
# Text Risk Scoring API
---
Last Updated time：2025-03-04 22:39:46

### Description
This API wil receive the input text, and return ten categories of scores.



### Parameters
|Name |Type |Mandatory |Description |
|------ |------ |------ |------ |
|method |String |Yes |API Interface Name |
|api_key |String |Yes |api_key for the usage |
|text |String |Yes |the text for the risk analysis |

### Post examples
</br>

**cURL**
```
curl https://api.obserpedia.com/v1/textriskscoring \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <Obserpedia_api_key>" \
  -d '{
        "text": "This was my last thoughts before you left"
      }'

```
</br>

**Python with Post**
```
import requests

url = "https://api.obserpedia.com/v1/textriskscoring"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <Obserpedia_api_key>"
}
data = {
    "text": "This was my last thoughts before you left"
}

response = requests.post(url, headers=headers, json=data)

print(response.status_code)  # Check HTTP status code (e.g., 200 for success)
print(response.json())       # Print the JSON response

```
</br>

**Nodejs**


```
const https = require('https');

const data = JSON.stringify({
  text: 'This was my last thoughts before you left'
});

const options = {
  hostname: 'api.obserpedia.com',
  path: '/v1/textriskscoring',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <Obserpedia_api_key>',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.parse(responseData));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
```

</br>


### Response
```
{
  "id": "grc-970d409ef3bef3b70c73d8232df86e7d",
  "results": [
  {'cat': 'jailbreaking',
  'score': 0.0,
  'reason': 'no attempt to bypass restrictions'},
 {'cat': 'illegal content',
  'score': 0.0,
  'reason': 'no unlawful activity suggested'},
 {'cat': 'hateful content',
  'score': 0.0,
  'reason': 'no hate speech or targeting'},
 {'cat': 'harassment',
  'score': 1.0,
  'reason': 'mildly aggressive tone but not targeted'},
 {'cat': 'racism', 'score': 0.0, 'reason': 'no racial elements'},
 {'cat': 'sexism', 'score': 0.0, 'reason': 'no gender-based derogation'},
 {'cat': 'violence', 'score': 0.0, 'reason': 'no violent language or threats'},
 {'cat': 'sexual content', 'score': 0.0, 'reason': 'no sexual references'},
 {'cat': 'harmful content',
  'score': 1.0,
  'reason': 'could imply intimidation but unclear context'},
 {'cat': 'unethical content',
  'score': 0.0,
  'reason': 'no unethical behavior promoted'}
  ]
}
```

</br>

### Return Code
|Error Code |Description |
|------ |------ |
|400 - invalid Format |Reason: Incorrect Format in the post body |
|401 - Authorization Failed |Reason: Incorrect api_key or missing app_key |
|429 - request limits exceeded |Reason: The times of request is exceeding the upper limit per the plan |
|500 - internal error |Reason: The server is too busy or the server is facing difficulty to handle the request

 






