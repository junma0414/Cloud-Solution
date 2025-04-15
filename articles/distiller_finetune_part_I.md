---
title: "Unlock the power of AI-Part I"
image: "/distillation.jpg"
date: 2025-02-15
---
# Unlock the power of AI - Part I
---

## How to make Language Models Smarter and Faster
In the world of artificial intelligence, Large Language Models (LLMs) like GPT, LLaMA, and Deepseek have taken center stage. These models can write essays, answer complex questions, and even generate code. 

But behind their impressive capabilities lies a challenge: they’re often massive, resource-hungry, time-bombing systems that require powerful hardware(GPU intensive computers) to run. 

This is where techniques like distillation and fine-tuning come into play. These methods not only make LLMs more efficient but also tailor them to specific tasks, unlocking their full potential for real-world applications.

We’ll break down these concepts in a way that’s easy to understand, without diving too deep into technical jargon. Let’s explore how distillation and fine-tuning are shaping the future of AI.

### What is LLM Distillation
In technical terms,distillation is the process of training a smaller, lightweight model to replicate the behavior of a larger, more complex model. The smaller model learns to generate similar outputs while using fewer computational resources. This is achieved by feeding the smaller model examples of the larger model’s responses and training it to match them as closely as possible.

Even though we will yet to take a look at the fine-tune technique, it is necessary to underline one important point: 
Distillation is not constrained to one particular industry, area or application. If the teacher knows everything, the students mean to learn everything from teacher. 

But for fine-tune, it is normally meant to enhance capability in a specific domain. For an education organization, they usually start their AI adoption with opensoured LLM, like LLAMA, Gemini, Deepseek, then fine-tuned it with educational corpus. 

### History of Distillation
Geoffrey Hinton Introduced knowledge distillation in 2015, which sparked new paradigm shift. This technique trained smaller “student” models to mimic larger “teacher” models.

Think of distillation as teaching a brilliant but overly complex professor’s knowledge to a sharp, quick-learning student. The professor (the original LLM) knows everything but is slow and resource-intensive. The student (the distilled model) learns to mimic the professor’s expertise but is smaller, faster, and more efficient.

### Why Distillation
Before Ford Model T comes from the pinepline in 1908, cars were luxury products for average family. With pipeline making large scale production, The country are now built on wheels. The same apply to LLMs. 

To unlock the power of AI and bring them into the great popularity among the daily life, a model with the dozens of billions of parameters and one year training is definitely out of our reach, either for personal or for most of the organization. So to have own models with comparable capability to real “large” models, but in a much more economical scale of hardware prerequisites and training time, distillation is salvage here. In short, it has a few advantage: 
- Efficiency: Smaller models require less memory and processing power, making them ideal for devices with limited resources, like smartphones or embedded systems.
- Speed: With parameters in smaller order of magnitude, a distilled model can generate responses much faster, which is critical for applications like real-time chatbots or voice assistants.
- Cost Savings: Running smaller models is cheaper because they don’t need expensive hardware or cloud infrastructure.

For example, OpenAI’s GPT-4 is a massive model with billions of parameters. A distilled version of GPT-4 might have only a fraction of those parameters but can still perform many of the same tasks effectively.

### The real world application of distillation
Model distillation has become a cornerstone of modern AI, enabling the deployment of powerful machine learning models in resource-starving environments. Below are a few real-world applications of distillation, with detailed examples and tailored use cases.

**Efficient Image Classification for Edge Devices**

Large image classification models like ResNet or EfficientNet are too computationally expensive to run on edge devices like security cameras or drones. So some authorities distill a smaller version of a pre-trained image classifier for real-time object detection and classification on edge devices.

For example:  A distilled version of ResNet-50 is deployed in a security camera to classify objects (e.g., people, vehicles, animals) in real time. The teacher model (ResNet-50) generates soft targets (class probabilities) for a large dataset of images. The student model (a smaller convolutional neural network) is trained to mimic these soft targets using distillation. 

The distilled model is optimized to run on the camera’s embedded hardware, ensuring real-time performance with limited computational resources. The security camera can classify objects locally without sending data to a central server, reducing latency, bandwidth usage, and privacy concerns.


**Lightweight Speech Recognition for Voice Assistants**


Large speech recognition models like Whisper or DeepSpeech are too resource-intensive to run on low-power devices like smart home assistants. To tackle this，a distilled version of OpenAI’s Whisper model is deployed in a smart home device to enable voice commands and transcription.

The teacher model (Whisper) generates soft targets (phoneme or word probabilities) for a large dataset of audio recordings. The student model (a smaller recurrent or transformer-based model) is trained to mimic these soft targets using distillation. 

After deploying the model a light-weighted smart home devices, a Users can interact with them using voice commands, even in environments with limited computational resources or internet connectivity.

**Efficient Sentiment Analysis for Social Media Monitoring**

Large sentiment analysis models are too slow and resource-intensive to analyze social media posts in real time.
So A pre-trained sentiment analysis model from distillation for real-time monitoring of social media platforms are deployed for brand sentiment. 

The teacher model (BERT) for this model generates soft targets (sentiment probabilities) for a large dataset of social media posts. The student model (a smaller transformer or logistic regression model) is trained to mimic these soft targets using distillation. 

Given the much smaller model,  Companies can monitor brand sentiment in real time, enabling quick responses to customer feedback and improving brand reputation even with the sheer volume of data 

In all these examples, distillation is used to create smaller, efficient versions of pre-trained models. The student models are trained to mimic the teacher’s behavior using soft targets, without any task-specific adaptation. 

## How distillation works
Let’s break down model distillation to understand how it works at its core. Distillation is essentially a process of transferring knowledge from a large, complex model (normally we call teacher model) to a smaller, simpler model (normally we call student model). 

The goal is to make the student model mimic the behavior of the teacher model as closely as possible, while being computationally more efficient.


**Teacher Model Output (Soft Targets)**

The teacher model produces output probabilities (soft labels) for each input. For a classification task, the teacher’s output is a probability distribution over the classes. 

Let’s denote: 

$p^T=[p_1^T,p_2^T,…,p_C^T]$ as The teacher’s output probabilities for _C_ classes.
$p^T$ is computed using a softmax function with a temperature parameter _T_ :
![Teacher model softmax](/softmaxTeacher.png )

where:
- $z_i^T$: The logit (raw output) for class _i_  from the teacher model.
- _T_ : Temperature parameter (controls the smoothness of the output distribution).

A higher _T_ makes the distribution softer (more uniform), revealing more information about the teacher’s knowledge. A lower T makes the distribution sharper, and likely to get more specific results. That is also why when we are invoking LLM API, we usually set T with lower value for maths, information retrievals and with higher value for design and innovative idea storming.

**Student Model Output**

The student model also produces output probabilities:
$p^S=[p_1^S,p_2^S,…,p_C^S]$
The student’s output probabilities for _C_ classes $p^S$ is computed similarly using a softmax function with the same temperature _T_ :
![Student model softmax](/softmaxStudent.png )
- $z_i^S$ : The logit for class _i_ from the student model.

**Loss Function**

The student is trained to minimize the difference between its output distribution (pS) and the teacher’s output distribution (pT). This is typically done using the **Kullback-Leibler (KL) Divergence**, which measures how one probability distribution diverges from another.

The distillation loss $L_{distill}$ is:
![distillation Loss](/distillationloss.png )


where:
- $KL(p^T||p^S)$=： The KL divergence between the teacher and student distributions.
- $T^2$:  A scaling factor to account for the temperature.

**Combining with Ground Truth Labels(optional)**

In addition to mimicking the teacher, the student can also be trained on the ground truth labels (hard labels) to improve performance. 
The total loss $L_{total}$ is a weighted combination of the distillation loss and the standard cross-entropy loss $L_{CE}$:
$L_{total}=α*Ldistill+(1−α)*L_{CE}$

where:
- $L_{CE}$=: Cross-entropy loss between the student’s output and the ground truth labels $y^i$.
- α: A weighting hyperparameter (typically between 0 and 1) that balances the influence of the teacher’s knowledge and the ground truth labels.

A few more words on the soft label and ground truth. Assume we use our teacher model to predict the type of animals, and we have four types of animals: dog, cat, bird and hen. in digital term, they are represented like this:
- Dog=[1.0,0,0]
- Cat=[0,1,0,0]
- Bird=[0,0,1,0]
- Hen=[0,0,0,1]

And based on the input, the teacher model has output of probability as:[0,1,0.1,0.7,0.1], which is the soft label.

On another hand, the input includes one and only ground truth label, which might be the same as or different from the teacher model output. But we only care about the soft label from teacher model and ground truth from training data.

### Implementing the distillation

Hope you stll remember how the distillation works and let me recap the follwing concepts:
- Teacher Model: A large, pre-trained model with high accuracy but high computational cost.
- Student Model: A smaller model that learns to approximate the teacher’s behavior.
- Soft Labels: The teacher’s output probabilities (soft labels) used to train the student.
- Loss Function: A mathematical function that measures how well the student is mimicking the teacher.
- Temeprature: A hyperparameter to control the sharpness of probability curve

Let us prepare teacher model
```
!pip install datasets
!pip install transformers
!pip install torch
from transformers import BertForSequenceClassification, DistilBertForSequenceClassification, BertTokenizer, DistilBertTokenizer
import torch
import torch.nn as nn
import torch.nn.functional as F

# Load teacher model (BERT)
teacher_model = BertForSequenceClassification.from_pretrained("bert-base-uncased")
teacher_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
```
- We install some important package, then import necessary ones. 
- Instead of starting from scratch, we download BertForSequenceClassification for model structure and BertTokenizer for input tokenization from HuggingFace 
- We finally instantiate the teacher model with the popular model “bert_base_uncased” and instantiate the paring tokenizer
Bert-base-uncased is a basic contextual understanding model. It performed perfectly with specific downstream model. For example, A classification model will receive the last_hidden_status from bert as input.

Then to prepare student model
```
# Load student model (DistilBERT)
student_model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased")
student_tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

#load datasets
from datasets import load_dataset

# Load the rotten_tomatoes dataset
dataset = load_dataset("rotten_tomatoes")

train_data=dataset['train']
val_data=dataset['validation']
test_data=dataset['test']
```
- We download DistilBertForSequenceClassification and DistilBertTokenizer from HuggingFace for model structure and input tokenization
- We instantiate the student model with the popular model “distilbert-base-uncased” and instantiate the paring tokenizer
- We use the built-in dataset “rotten_tomatoes”. It keeps reviews to movies and a label: 1 for positive and 0 for negative judgement of the referring movie.
- We split all the data set into three parts: data for training, data for validation and data for testing

Next are the definitions of two functions:
```
def tokenize_data(dataset, tokenizer):
	texts = [example["text"] for example in dataset]
	labels = [example["label"] for example in dataset]
	encodings = tokenizer(texts, truncation=True, padding=True, return_tensors="pt")
	return encodings, torch.tensor(labels)

# Tokenize with teacher tokenizer
teacher_encodings, teacher_labels = tokenize_data(train_data, teacher_tokenizer)

# Tokenize with student tokenizer
student_encodings, student_labels = tokenize_data(train_data, student_tokenizer)


def distiller_loss(student_logits,soft_labels, hard_labels, temperature=2.0, alpha=0.5):
	soft_loss = F.kl_div(
		F.log_softmax(student_logits / temperature, dim=-1),
		F.softmax(soft_labels / temperature, dim=-1),
		reduction="batchmean",) * (temperature**2)

	# Hard loss (cross-entropy between student and ground truth)
	hard_loss = F.cross_entropy(student_logits, hard_labels)

	#return weighted loss
	return alpha * soft_loss + (1 - alpha) * hard_loss
```
- A general tokenizing function tokenize_data is defined , turning feeding text into tokens
- A crucial loss function distill_loss() is defined, using KL_divergence to compute the soft loss and cross entropy for hard loss. 
- The parameters temperature here is for controlling the sharpness of the probability curve after softmax operation and alpha is to compute the weighted loss from soft one and hard one.

OK! We not start our distillation:
```
from torch.utils.data import DataLoader

import torch.optim as optim

# Disable gradient calculation for teacher model
with torch.no_grad():
	teach_logits=teacher_model(**teacher_encodings[:2000]).logits

soft_label=torch.softmax(teach_logits,dim=-1)

# Create DataLoader(the index limitation is just to avoid the storage limit error)
train_dataset = torch.utils.data.TensorDataset(student_encodings[:2000]["input_ids"], student_encodings[:2000]["attention_mask"], soft_label, student_labels[:2000])
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

# Optimizer and set the learning rate small as best practice
optimizer = optim.AdamW(student_model.parameters(), lr=5e-5)

# Training loop
for epoch in range(3): # Number of epochs
	student_model.train()
	for batch in train_loader:
	input_ids, attention_mask, soft_labels_batch, hard_labels_batch = batch

	# Forward pass
	student_logits = student_model(input_ids=input_ids, attention_mask=attention_mask).logits

	# Compute loss
	loss = distiller_loss(student_logits, soft_labels_batch, hard_labels_batch)

	# Backward propagation
	loss.backward()
	optimizer.step()
	optimizer.zero_grad()

	print(f"Epoch {epoch + 1} completed. Loss: {loss.item()}")

#save or load trained student model
student_model.save_pretrained("distilled_student_model")
```
- run teach_logits=teacher_model(**teacher_encodings[:2000]).logits to get the logit after teacher model inference
- [:2000] sliding in the codes is meant to feed the first 2000 records into training. However, it is just to ensure the code can run in the very weak computers. 
- DataLoader from torch.utils.data help chop data by batch to facilitate the training by batch
- Then we get the logits by running forward pass through student model
- Loss was computed and parameters were adjusted by backward propagation in the loop
- Finally, you can save the distilled model for later purpose

Let us check how we can evaluate the distilled student model:
```
student_model.eval()
with torch.no_grad():
	# Example evaluation
	val_encodings, val_labels = tokenize_data(val_data, student_tokenizer)
	val_logits = student_model(**val_encodings).logits
	#the task is to classify 0 or 1. So we just get the index where there is biggest probabilities 
	#so the torch.argmax will return either 1 or 0
	val_preds = torch.argmax(val_logits, dim=-1) 
	accuracy = (val_preds == val_labels).float().mean()
	print(f"Validation Accuracy: {accuracy.item()}")
```
And the output combining the training logs are below:
```
Epoch 1 completed. Loss: 0.21957969665527344
Epoch 2 completed. Loss: 0.2221548855304718
Epoch 3 completed. Loss: 0.2228141576051712
Validation Accuracy: 0.5
``` 

Values here seems to have big losses and model being unfitted. After all, I only use small number of training data. If you have a powerful machine, you can fit model with all the data and get much better outputs here.

### Teacher model and Student model differs
Again, teacher model and student model differs in the number of parameters and the structure, as shown below:
```
print("The number of parameters in student_model is: ",student_model.num_parameters())
print("The structure in student_model is: ",student_model,"\n")
print("---------------------------------------------------------------------------\n")

print("The number of parameters in teacher_model is: ",teacher_model.num_parameters())
print("The structure of teacher model is: ",teacher_model)
```
Here are output:
```
The number of parameters in student_model is:  66955010
The structure in student_model is:  DistilBertForSequenceClassification(
  (distilbert): DistilBertModel(
    (embeddings): Embeddings(
      (word_embeddings): Embedding(30522, 768, padding_idx=0)
      (position_embeddings): Embedding(512, 768)
      (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
      (dropout): Dropout(p=0.1, inplace=False)
    )
    (transformer): Transformer(
      (layer): ModuleList(
        (0-5): 6 x TransformerBlock(
          (attention): DistilBertSdpaAttention(
            (dropout): Dropout(p=0.1, inplace=False)
            (q_lin): Linear(in_features=768, out_features=768, bias=True)
            (k_lin): Linear(in_features=768, out_features=768, bias=True)
            (v_lin): Linear(in_features=768, out_features=768, bias=True)
            (out_lin): Linear(in_features=768, out_features=768, bias=True)
          )
          (sa_layer_norm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
          (ffn): FFN(
            (dropout): Dropout(p=0.1, inplace=False)
            (lin1): Linear(in_features=768, out_features=3072, bias=True)
            (lin2): Linear(in_features=3072, out_features=768, bias=True)
            (activation): GELUActivation()
          )
          (output_layer_norm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
        )
      )
    )
  )
  (pre_classifier): Linear(in_features=768, out_features=768, bias=True)
  (classifier): Linear(in_features=768, out_features=2, bias=True)
  (dropout): Dropout(p=0.2, inplace=False)
) 

---------------------------------------------------------------------------

The number of parameters in teacher_model is:  109483778
The structure of teacher model is:  BertForSequenceClassification(
  (bert): BertModel(
    (embeddings): BertEmbeddings(
      (word_embeddings): Embedding(30522, 768, padding_idx=0)
      (position_embeddings): Embedding(512, 768)
      (token_type_embeddings): Embedding(2, 768)
      (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
      (dropout): Dropout(p=0.1, inplace=False)
    )
    (encoder): BertEncoder(
      (layer): ModuleList(
        (0-11): 12 x BertLayer(
          (attention): BertAttention(
            (self): BertSdpaSelfAttention(
              (query): Linear(in_features=768, out_features=768, bias=True)
              (key): Linear(in_features=768, out_features=768, bias=True)
              (value): Linear(in_features=768, out_features=768, bias=True)
              (dropout): Dropout(p=0.1, inplace=False)
            )
            (output): BertSelfOutput(
              (dense): Linear(in_features=768, out_features=768, bias=True)
              (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
              (dropout): Dropout(p=0.1, inplace=False)
            )
          )
          (intermediate): BertIntermediate(
            (dense): Linear(in_features=768, out_features=3072, bias=True)
            (intermediate_act_fn): GELUActivation()
          )
          (output): BertOutput(
            (dense): Linear(in_features=3072, out_features=768, bias=True)
            (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
            (dropout): Dropout(p=0.1, inplace=False)
          )
        )
      )
    )
    (pooler): BertPooler(
      (dense): Linear(in_features=768, out_features=768, bias=True)
      (activation): Tanh()
    )
  )
  (dropout): Dropout(p=0.1, inplace=False)
  (classifier): Linear(in_features=768, out_features=2, bias=True)
)
````

<br>



### Student Model is pre-trained or from scratch

Here are some last words for student model: It is totally fine to construct your own student model from scratch with pytorch, tensorflow or other frameworks. Just remember to : 
- Initiate the parameters so they can directly be used in the distillation
- Find the compatible tokenizer so the text splitting, sentence padding will be handled in accordance.

For [Unlock the power of AI-Part II](/article/distiller_finetune_part_II)

---
**Author: Jun Ma, co-founder of obserpedia**
 






