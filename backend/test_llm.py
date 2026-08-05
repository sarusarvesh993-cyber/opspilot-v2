import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENROUTER_API_KEY", "")
model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

print("KEY present:", bool(key))
print("KEY repr:", repr(key))          # reveals hidden \n \r spaces
print("MODEL:", repr(model))

key = key.strip()
model = model.strip()

payload = json.dumps({
    "model": model,
    "messages": [{"role": "user", "content": "Reply with exactly: OPENROUTER_OK"}],
    "max_tokens": 20,
}).encode("utf-8")

req = urllib.request.Request(
    "https://openrouter.ai/api/v1/chat/completions",
    data=payload,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "OpsPilot",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    print("RESPONSE:", data["choices"][0]["message"]["content"])
except Exception as e:
    print("RAW ERROR:", repr(e))
    try:
        print("ERROR BODY:", e.read().decode("utf-8"))
    except Exception:
        pass