from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import csv
import os

app = Flask(__name__)
CORS(app)

# Load model and vectorizer
model = joblib.load("fake_job_detector_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

# Extract features and coefficients
feature_names = vectorizer.get_feature_names_out()
coefficients = model.coef_[0]

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' in request"}), 400

    input_text = data["text"]
    vectorized = vectorizer.transform([input_text])
    prediction = model.predict(vectorized)[0]
    proba = model.predict_proba(vectorized)[0]

    # Get suspicious words (top 5 by weight)
    input_tokens = input_text.lower().split()
    important_words = {
        word: coefficients[vectorizer.vocabulary_.get(word)]
        for word in input_tokens
        if word in vectorizer.vocabulary_
    }

    suspicious_keywords = sorted(
        important_words.items(), key=lambda x: x[1], reverse=True
    )[:5]
    top_words = [word for word, score in suspicious_keywords]

    return jsonify({
        "prediction": "fake" if prediction == 1 else "real",
        "confidence": round(float(proba[prediction]) * 100, 2),
        "suspicious_keywords": top_words
    })

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    text = data.get("text", "")
    prediction = data.get("prediction", "")
    correct_label = data.get("correct_label", "")

    if not text or not prediction:
        return jsonify({"error": "Missing required fields"}), 400

    # Save to feedback.csv
    file_exists = os.path.isfile("feedback.csv")
    with open("feedback.csv", "a", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "prediction", "correct_label"])
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            "text": text,
            "prediction": prediction,
            "correct_label": correct_label
        })

    return jsonify({"message": "Feedback received!"})

if __name__ == "__main__":
    app.run(debug=True)
