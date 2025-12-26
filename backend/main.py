from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from data.courses import courses

app = FastAPI(title="Course Recommender API")

@app.get("/")
def redirect_to_ui():
    return RedirectResponse(url="/ui/")

app.mount("/ui", StaticFiles(directory="frontend", html=True), name="frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
model = SentenceTransformer("all-MiniLM-L6-v2")

# Prepare course texts and embeddings
course_texts = [
    f"{c['code']} {c['title']}: {c['description']}"
    for c in courses
]
course_embeddings = model.encode(course_texts)


class RecommendRequest(BaseModel):
    query: str
    k: int = 5


@app.get("/health")
def health():
    return {"status": "ok", "num_courses": len(courses)}


@app.post("/recommend")
def recommend(req: RecommendRequest):
    if not req.query.strip():
        return {"results": []}

    query_embedding = model.encode([req.query])
    similarities = cosine_similarity(query_embedding, course_embeddings)[0]
    ranked_indices = similarities.argsort()[::-1][:req.k]

    results = []
    for idx in ranked_indices:
        c = courses[idx]
        results.append({
            "code": c["code"],
            "title": c["title"],
            "description": c["description"],
            "score": float(similarities[idx])
        })

    return {"query": req.query, "results": results}

