import pandas as pd
import numpy as np
import joblib
import os
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer

# === CONFIG ===
ORIGINAL_DATASET = "fake_job_postings.csv"
FEEDBACK_FILE = "feedback.csv"
MODEL_OUTPUT = "fake_job_detector_model.pkl"
VECTORIZER_OUTPUT = "tfidf_vectorizer.pkl"

def load_and_prepare_data():
    # Load original dataset
    df = pd.read_csv(ORIGINAL_DATASET)
    df = df.dropna(subset=["description"])
    
    text_cols = ['title', 'location', 'department', 'salary_range', 'company_profile',
                 'description', 'requirements', 'benefits', 'employment_type',
                 'required_experience', 'required_education', 'industry', 'function']
    df[text_cols] = df[text_cols].fillna("")

    df["text"] = df["title"] + " " + df["company_profile"] + " " + df["description"] + " " + df["requirements"] + " " + df["benefits"]
    original_data = df[["text", "fraudulent"]].rename(columns={"fraudulent": "label"})

    # Try to load feedback
    if os.path.exists(FEEDBACK_FILE):
        feedback_df = pd.read_csv(FEEDBACK_FILE)
        feedback_df = feedback_df.dropna(subset=["correct_label", "text"])
        label_map = {"real": 0, "fake": 1}
        feedback_df["label"] = feedback_df["correct_label"].map(label_map)
        feedback_df = feedback_df[["text", "label"]]
        combined_data = pd.concat([original_data, feedback_df], ignore_index=True)
    else:
        combined_data = original_data

    return combined_data

def train_and_save_model(data):
    X_text = data["text"]
    y = data["label"]

    # Vectorization
    vectorizer = TfidfVectorizer(stop_words="english", max_features=10000)
    X = vectorizer.fit_transform(X_text)

    # Train model
    model = LogisticRegression(class_weight="balanced", max_iter=1000)
    model.fit(X, y)

    # Save model and vectorizer
    joblib.dump(model, MODEL_OUTPUT)
    joblib.dump(vectorizer, VECTORIZER_OUTPUT)
    print(f"✅ Model and vectorizer saved as '{MODEL_OUTPUT}' and '{VECTORIZER_OUTPUT}'")

if __name__ == "__main__":
    print("📊 Loading data...")
    data = load_and_prepare_data()
    print(f"🔢 Training on {len(data)} samples...")
    train_and_save_model(data)
