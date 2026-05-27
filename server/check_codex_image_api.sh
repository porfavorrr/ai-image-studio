#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${CODEX_IMAGE_API_BASE_URL:-http://127.0.0.1:8000}"
OUT_DIR="${1:-/tmp/codex-image-api-check}"
TEXT_OUT="$OUT_DIR/text.png"

mkdir -p "$OUT_DIR"

echo "== Health =="
curl -fsS "$BASE_URL/health"
echo

echo "== Debug =="
curl -fsS "$BASE_URL/debug"
echo

echo "== Text image test =="
curl -fsS -X POST "$BASE_URL/v1/images/text" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a simple clean blue square PNG image. No text. Save the final image exactly at the requested output path."}' \
  --output "$TEXT_OUT"

file "$TEXT_OUT" || true
ls -lh "$TEXT_OUT"
echo "Saved: $TEXT_OUT"

if [ -n "${REFERENCE_IMAGE:-}" ]; then
  REF_OUT="$OUT_DIR/reference.png"
  echo "== Reference image test =="
  curl -fsS -X POST "$BASE_URL/v1/images/reference" \
    -F "prompt=Use the uploaded image as reference and create a clean polished edited PNG result. Save the final image exactly at the requested output path." \
    -F "image=@${REFERENCE_IMAGE}" \
    --output "$REF_OUT"
  file "$REF_OUT" || true
  ls -lh "$REF_OUT"
  echo "Saved: $REF_OUT"
else
  echo "Skip reference test. To run it:"
  echo "REFERENCE_IMAGE=/path/to/test.jpg bash server/check_codex_image_api.sh"
fi
