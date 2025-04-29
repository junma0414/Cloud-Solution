---
title: "Drift Extraction API"
date: 2025-02-14
---
# Drift Extraction API
---
Last Updated time：2025-03-04 22:39:46

### Description
This API wil receive the input text, and return entity_group,entity，count and overall statistics:


**domain**

http://obserpedia.com/


**route(path)**

/api/v1/ner


### Parameters
|Name |Type |Mandatory |Description |Sample Value
|------ |------ |------ |------ |------ |
|method |String |Yes |API Interface Name |/api/v1/<method name> |
|api_key |String |Yes |api_key for the usage |sk_12345678987654321 |
|text |String |Yes |the text for the scoring analysis | |
|project_name |String |No |you can define in the post body or eliminate it. |"dummy project" | 
|model_name |String |No |you can define in the post body or eliminate it. |"dummy model" | 
|topn |Integer |No |the output will be sorted by the count of each entity, topn will limit the numbers of output. Set to zero for all output, and default is 20 |5 |
|session_id |String |No |it is to specify the session between assistant and clients | |
|session_dialog_id |String |No |it is to specify a particular dialog(text) duing the session | |
|session_dialog_dt |timestamp(with timezone) |Yes |the time when the session_dialog happen |2025-01-08 23:51:24.328243+08:00 or in simple form 2025-01-08 23:51:24+08. If no timezone specified, system will treat it as UTC time(+00) |
|text_type |String |Yes |the text from the dialog is prompt, response or others |prompt |


### Post examples
</br>

**cURL**

Note:You will need add or remove backward slash in accordance with OS where your console is running and use '^' as line break on windows
```
curl -X POST http://obserpedia.com/api/v1/ner ^
  -H "x-api-key: <your_api_key>" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Various industries and applications use NER in different ways. Each use case simplifies searching for and extracting important information from large data volumes so people can spend time on more valuable tasks. Examples include the following:\n\nChatbots. OpenAI's generative AI, ChatGPT, Google's Bard and other chatbots use NER models to identify relevant entities mentioned in user queries and conversations. This helps them understand the context of a user's question and improves chatbot responses.\nCustomer support. NERs organize customer feedback and complaints by product name and identify common or trending complaints about specific products or branch locations. This helps customer support teams prepare for incoming queries, respond faster and establish automated systems that route customers to relevant support desks and sections of FAQ pages.\nFinance. NER extracts figures from private markets, loans and earnings reports, increasing the speed and accuracy of analyzing profitability and credit risk. NER also extracts names and companies mentioned in social media and other online posts, helping financial institutions monitor trends and developments that could affect stock prices.\nHealthcare. NER tools extract critical information from lab reports and patients' electronic health records, helping healthcare providers reduce workloads, analyze data faster and more accurately, and improve care.\nHigher education. NER lets students, researchers and professors quickly summarize volumes of papers and archival material, as well as find relevant subjects, topics and themes.\nHR. These systems streamline recruitment and hiring by summarizing applicants' resumes and extracting information, such as qualifications, education and references. NER also filters employee complaints and queries to the relevant departments, helping organize internal workflows.\nMedia. News providers use NER to analyze the many articles and social media posts they need to read and to categorize the content into important information and trends. This helps them quickly understand and report on news and current events.\nRecommendation engines. Many companies use NER to improve the relevancy of their recommendation engines. For instance, companies like Netflix use NER to analyze users' searches and viewing histories to provide personalized recommendations.\nSearch engines. NER helps search engines identify and categorize subjects mentioned on the web and in searches. This lets search platforms understand the relevancy of subjects to a user's search and provide users with accurate results.\nSentiment analysis. NER is a key component of sentiment analysis. It extracts product names, brands and other information mentioned in customer reviews, social media posts and other unstructured text. The sentiment analysis tool then analyzes the information to determine the author's feelings about a product, company or other subject. \nNER is also used to analyze employee sentiment in survey responses and complaints.\",\"project_name\":\"ner demo\",\"model_name\":\"ner demo model\",\"topn\":0,\"session_id\":\"12345\", \"session_dialog_id\":\"12345-5\", \"session_dialog_dt\": \"2025-01-08 23:51:29+07\", \"text_type\":\"response\"}"


```
</br>

**Python with Post**
```
import requests
import json

url = "http://obserpedia.com/api/v1/ner"
headers = {
    "x-api-key": "<your_api_key>",
    "Content-Type": "application/json"
}
data = {"text":"""Various industries and applications use NER in different ways. Each use case simplifies searching for and extracting important information from large data volumes so people can spend time on more valuable tasks. Examples include the following:

Chatbots. OpenAI's generative AI, ChatGPT, Google's Bard and other chatbots use NER models to identify relevant entities mentioned in user queries and conversations. This helps them understand the context of a user's question and improves chatbot responses.
Customer support. NERs organize customer feedback and complaints by product name and identify common or trending complaints about specific products or branch locations. This helps customer support teams prepare for incoming queries, respond faster and establish automated systems that route customers to relevant support desks and sections of FAQ pages.
Finance. NER extracts figures from private markets, loans and earnings reports, increasing the speed and accuracy of analyzing profitability and credit risk. NER also extracts names and companies mentioned in social media and other online posts, helping financial institutions monitor trends and developments that could affect stock prices.
Healthcare. NER tools extract critical information from lab reports and patients' electronic health records, helping healthcare providers reduce workloads, analyze data faster and more accurately, and improve care.
Higher education. NER lets students, researchers and professors quickly summarize volumes of papers and archival material, as well as find relevant subjects, topics and themes.
HR. These systems streamline recruitment and hiring by summarizing applicants' resumes and extracting information, such as qualifications, education and references. NER also filters employee complaints and queries to the relevant departments, helping organize internal workflows.
Media. News providers use NER to analyze the many articles and social media posts they need to read and to categorize the content into important information and trends. This helps them quickly understand and report on news and current events.
Recommendation engines. Many companies use NER to improve the relevancy of their recommendation engines. For instance, companies like Netflix use NER to analyze users' searches and viewing histories to provide personalized recommendations.
Search engines. NER helps search engines identify and categorize subjects mentioned on the web and in searches. This lets search platforms understand the relevancy of subjects to a user's search and provide users with accurate results.
Sentiment analysis. NER is a key component of sentiment analysis. It extracts product names, brands and other information mentioned in customer reviews, social media posts and other unstructured text. The sentiment analysis tool then analyzes the information to determine the author's feelings about a product, company or other subject. 
NER is also used to analyze employee sentiment in survey responses and complaints.""",
"project_name":"ner demo", 
"model name":"ner demo model", 
"topn":0,
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

const url = 'http://obserpedia.com/api/v1/ner';

const headers = {
  'x-api-key': '<your_api_key>',
  'Content-Type': 'application/json',
};

const data = {
  text: `Various industries and applications use NER in different ways. Each use case simplifies searching for and extracting important information from large data volumes so people can spend time on more valuable tasks. Examples include the following:

Chatbots. OpenAI's generative AI, ChatGPT, Google's Bard and other chatbots use NER models to identify relevant entities mentioned in user queries and conversations. This helps them understand the context of a user's question and improves chatbot responses.
Customer support. NERs organize customer feedback and complaints by product name and identify common or trending complaints about specific products or branch locations. This helps customer support teams prepare for incoming queries, respond faster and establish automated systems that route customers to relevant support desks and sections of FAQ pages.
Finance. NER extracts figures from private markets, loans and earnings reports, increasing the speed and accuracy of analyzing profitability and credit risk. NER also extracts names and companies mentioned in social media and other online posts, helping financial institutions monitor trends and developments that could affect stock prices.
Healthcare. NER tools extract critical information from lab reports and patients' electronic health records, helping healthcare providers reduce workloads, analyze data faster and more accurately, and improve care.
Higher education. NER lets students, researchers and professors quickly summarize volumes of papers and archival material, as well as find relevant subjects, topics and themes.
HR. These systems streamline recruitment and hiring by summarizing applicants' resumes and extracting information, such as qualifications, education and references. NER also filters employee complaints and queries to the relevant departments, helping organize internal workflows.
Media. News providers use NER to analyze the many articles and social media posts they need to read and to categorize the content into important information and trends. This helps them quickly understand and report on news and current events.
Recommendation engines. Many companies use NER to improve the relevancy of their recommendation engines. For instance, companies like Netflix use NER to analyze users' searches and viewing histories to provide personalized recommendations.
Search engines. NER helps search engines identify and categorize subjects mentioned on the web and in searches. This lets search platforms understand the relevancy of subjects to a user's search and provide users with accurate results.
Sentiment analysis. NER is a key component of sentiment analysis. It extracts product names, brands and other information mentioned in customer reviews, social media posts and other unstructured text. The sentiment analysis tool then analyzes the information to determine the author's feelings about a product, company or other subject. 
NER is also used to analyze employee sentiment in survey responses and complaints.`,
  project_name: 'ner demo',
  model_name: 'ner demo model',
  topn: 0,
  session_id:'12345',
  session_dialog_id:'12345-1',
  session_dialog_dt:'2025-01-08 23:51:29+07',
  text_type:'response'
};

axios.post(url, data, { headers })
  .then(response => {
    console.log("Response:", response.data);
  })
  .catch(error => {
    console.error("Error making request:", error.message);
    if (error.response) {
      console.error("Server responded with:", error.response.data);
    }
  });

```

</br>


### Sample Response
```
{'success': True, 'entity': [{'entity_group': 'ORG', 'entity': 'OpenAI', 'count': 1.0}, {'entity_group': 'ORG', 'entity': 'Cha', 'count': 1.0}, {'entity_group': 'ORG', 'entity': '##tGPT', 'count': 1.0}, {'entity_group': 'ORG', 'entity': 'Google', 'count': 1.0}, {'entity_group': 'ORG', 'entity': 'Bard', 'count': 1.0}, {'entity_group': 'ORG', 'entity': '##R', 'count': 1.0}], 'entity_len': 6, 'entity_count_total': 6, 'error': None, 'request_id': 'a7b89227-1c80-4bac-b90a-2bca85c3ebd9'}
```

</br>

### Return Code

 






