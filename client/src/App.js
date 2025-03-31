import React, { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suspiciousWords, setSuspiciousWords] = useState([]);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(null);
  const [correctLabel, setCorrectLabel] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setSuspiciousWords([]);
    setFeedbackGiven(false);
    setFeedbackCorrect(null);
    setCorrectLabel("");
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data);
      setSuspiciousWords(data.suspicious_keywords || []);
    } catch (error) {
      setResult({ error: "Something went wrong!" });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (feedbackCorrect === null) return;

    const payload = {
      text,
      prediction: result.prediction,
      correct_label: feedbackCorrect ? result.prediction : correctLabel,
    };

    try {
      await fetch("http://localhost:5000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setFeedbackGiven(true);
    } catch (error) {
      console.error("Feedback submission failed", error);
    }
  };

  return (
    <div className="App">
      <h1>🕵️‍♂️ Fake Job Detector</h1>

      <textarea
        rows="10"
        cols="60"
        placeholder="Paste a job description here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Check Job Post"}
      </button>

      {result && (
        <div className="result">
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <h3>Prediction: {result.prediction.toUpperCase()}</h3>
              <p>Confidence: {result.confidence}%</p>

              {suspiciousWords.length > 0 && (
                <>
                  <h4>Suspicious Keywords:</h4>
                  <ul>
                    {suspiciousWords.map((word, index) => (
                      <li key={index}>
                        <mark>{word}</mark>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Feedback UI */}
              {!feedbackGiven && (
                <div style={{ marginTop: "2rem" }}>
                  <h4>Was this prediction correct?</h4>
                  <button onClick={() => setFeedbackCorrect(true)}>👍 Yes</button>
                  <button onClick={() => setFeedbackCorrect(false)}>👎 No</button>

                  {!feedbackCorrect && feedbackCorrect !== null && (
                    <>
                      <p style={{ marginTop: "1rem" }}>What was the correct label?</p>
                      <select
                        value={correctLabel}
                        onChange={(e) => setCorrectLabel(e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        <option value="real">Real</option>
                        <option value="fake">Fake</option>
                      </select>
                    </>
                  )}

                  {((feedbackCorrect && feedbackCorrect !== null) ||
                    (!feedbackCorrect && correctLabel)) && (
                    <div style={{ marginTop: "1rem" }}>
                      <button onClick={submitFeedback}>Submit Feedback</button>
                    </div>
                  )}
                </div>
              )}

              {feedbackGiven && <p style={{ color: "green" }}>✅ Thanks for your feedback!</p>}
            </>
          )}
        </div>
      )}

      {result && !result.error && (
        <div
          style={{
            marginTop: "2rem",
            textAlign: "left",
            maxWidth: "600px",
            margin: "2rem auto",
            backgroundColor: "#f9f9f9",
            padding: "1rem",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
          }}
        >
          <h4>Highlighted Description:</h4>
          {text.split(/\s+/).map((word, index) => {
            const clean = word.toLowerCase().replace(/[.,!]/g, "");
            const isSuspicious = suspiciousWords.includes(clean);
            return (
              <span
                key={index}
                style={{
                  backgroundColor: isSuspicious ? "yellow" : "transparent",
                  fontWeight: isSuspicious ? "bold" : "normal",
                  marginRight: "4px",
                }}
              >
                {word + " "}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
