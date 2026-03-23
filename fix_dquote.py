"""
QA fix: remove double-quotes from escapeDrawtext.
Double quotes in narracao/ctaText break the ffmpeg shell command
because filterComplex is embedded inside double quotes.
"""
import json, urllib.request, urllib.error, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"

def get(wf_id):
    req = urllib.request.Request("https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id)
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def put(wf_id, wf):
    url = "https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id
    payload = {"name": wf["name"], "nodes": wf["nodes"], "connections": wf["connections"], "settings": wf.get("settings", {})}
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("ERRO:", e.code, e.read().decode()[:300])
        return e.code

OLD = """.replace(/[\[\]%]/g, '')"""
NEW = """.replace(/[\[\]%"]/g, '')"""

wf = get("zloYjCYLVf6BWhF9")
for node in wf["nodes"]:
    if node["name"] == "FFmpeg: Assemble Video":
        code = node["parameters"]["jsCode"]
        if '"' not in OLD or OLD not in code:
            # Try alternative match
            OLD2 = ".replace(/[\\[\\]%]/g, '')"
            if OLD2 in code:
                node["parameters"]["jsCode"] = code.replace(OLD2, ".replace(/[\\[\\]%\"]/g, '')")
                print("Patched escapeDrawtext (alt match)")
            else:
                # Just do a targeted replace on the exact line
                node["parameters"]["jsCode"] = code.replace(
                    ".replace(/[\\[\\]%]/g, '')",
                    ".replace(/[\\[\\]%\"]/g, '')"
                )
                print("Patched escapeDrawtext")
        else:
            node["parameters"]["jsCode"] = code.replace(OLD, NEW)
            print("Patched escapeDrawtext")

st = put("zloYjCYLVf6BWhF9", wf)
print("PUT:", st)
