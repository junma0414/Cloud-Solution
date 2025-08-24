from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import datetime
import re

app = FastAPI()

# ===== 数据结构 =====
class DataPoint(BaseModel):
    time: str
    text: str

class InputData(BaseModel):
    data: List[DataPoint]

# ===== 工具函数 =====
def is_ai_output(text: str) -> bool:
    """
    判断输入是否更像模型输出而不是原始文本
    """
    markers = ["结论", "总结", "分析", "建议", "报告", "1.", "2.", "3.", "•", "- "]
    return any(m in text for m in markers) and len(text.split()) > 30

def extract_keywords(text: str, topk: int = 5) -> List[str]:
    # 简化实现：取前 topk 个独特词
    words = re.findall(r'\w+', text)
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    return sorted(freq, key=freq.get, reverse=True)[:topk]

def analyze_sentiment(text: str) -> str:
    if any(w in text for w in ["good", "great", "happy", "positive", "excellent", "好", "满意"]):
        return "positive"
    elif any(w in text for w in ["bad", "sad", "angry", "negative", "差", "不满"]):
        return "negative"
    return "neutral"

def cluster_texts(texts: List[str]) -> List[Dict[str, Any]]:
    keywords = extract_keywords(" ".join(texts))
    clusters = []
    for kw in keywords:
        examples = [t for t in texts if kw.lower() in t.lower()]
        clusters.append({"topic": kw, "examples": examples[:3]})
    return clusters

def trend_analysis(times: List[str], texts: List[str]) -> Dict[str, Any]:
    # 按日期统计文本数量
    daily_count = {}
    for t in times:
        date = t.split("T")[0] if "T" in t else t
        daily_count[date] = daily_count.get(date, 0) + 1
    return {"dates": list(daily_count.keys()), "series": list(daily_count.values())}

def llm_generate_report(texts: List[str], keywords: List[str], clusters: List[Dict[str, Any]]) -> str:
    return f"📊 自动报告\n关键词: {', '.join(keywords)}\n聚类主题数: {len(clusters)}\n样本文本数: {len(texts)}"

# ===== 主分析 API =====
@app.post("/analyze")
def analyze(input_data: InputData):
    texts = [d.text for d in input_data.data]
    times = [d.time for d in input_data.data]

    joined_text = " ".join(texts)

    if is_ai_output(joined_text):
        # ✅ 模型输出模式
        mode = "模型输出模式"
        report = joined_text
        keywords = extract_keywords(report)
        clusters = [{"topic": k, "examples": []} for k in keywords[:5]]
        trend_data = {"dates": [], "series": []}  # 没有时间序列
        sentiments = []
    else:
        # ✅ 原始文本模式
        mode = "原始文本模式"
        keywords = extract_keywords(joined_text)
        sentiments = [analyze_sentiment(t) for t in texts]
        clusters = cluster_texts(texts)
        trend_data = trend_analysis(times, texts)
        report = llm_generate_report(texts, keywords, clusters)

    return {
        "mode": mode,
        "report": report,
        "keywords": keywords,
        "clusters": clusters,
        "trend": trend_data,
        "sentiments": sentiments
    }
