"""
LearnAble - AI-Powered Adaptive Learning Platform for Children with Learning Differences
Local prototype server.
THIS IS JUST A PROTOTYPE. NOT COMPLETE. NOT SECURE.
for more info contact 8978064566,
This Flask app simply serves the single-page application (index.html)
and its static assets (CSS/JS). All application data (students, sessions,
settings) is stored client-side in the browser's localStorage, so the app
keeps working offline after the first load and survives page refreshes.

Run with:
    pip install -r requirements.txt
    python app.py

Then open http://127.0.0.1:5000 in your browser.
"""

from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the LearnAble single-page application."""
    return send_from_directory(app.root_path, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
