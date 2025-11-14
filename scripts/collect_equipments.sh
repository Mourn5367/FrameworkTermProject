#!/bin/bash

# ========================================
# 던파 캐릭터 장비 대량 수집 스크립트
# 69개 眞 직업 × 100명 = 6,900명 수집
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JOBS_FILE="${SCRIPT_DIR}/all_jobs.json"
LOG_FILE="${SCRIPT_DIR}/collection_$(date +%Y%m%d_%H%M%S).log"
API_URL="http://localhost:8080/api/ranking/collect"

TOTAL_JOBS=69
SUCCESS=0
FAILED=0
TOTAL_CHARS=0

echo "🚀 Starting equipment collection for ${TOTAL_JOBS} jobs..." | tee -a "$LOG_FILE"
echo "📝 Log file: ${LOG_FILE}" | tee -a "$LOG_FILE"
echo ""

# Python으로 JSON 파싱 (jq 불필요)
INDEX=0
python3 << 'PYEOF' | while IFS='|' read -r job_id job_grow_id job_name job_grow_name; do
import json
import sys
from urllib.parse import quote

with open('/home/aisw/Next_Spring/scripts/all_jobs.json', 'r', encoding='utf-8') as f:
    jobs = json.load(f)

for job in jobs:
    # URL encoding for Korean characters
    job_name_encoded = quote(job['jobName'])
    job_grow_name_encoded = quote(job['jobGrowName'])
    print(f"{job['jobId']}|{job['jobGrowId']}|{job_name_encoded}|{job_grow_name_encoded}")
PYEOF

  INDEX=$((INDEX + 1))

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
  echo "[${INDEX}/${TOTAL_JOBS}] ${job_grow_name}" | tee -a "$LOG_FILE"

  # API 호출 (jobName과 jobGrowName 추가)
  RESPONSE=$(curl -s -X POST "${API_URL}?jobId=${job_id}&jobGrowId=${job_grow_id}&jobName=${job_name}&jobGrowName=${job_grow_name}")

  # 응답에서 successCount 추출 (Python 사용)
  SUCCESS_COUNT=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('successCount', 0))" 2>/dev/null || echo "0")
  FAIL_COUNT=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('failCount', 0))" 2>/dev/null || echo "0")

  if [ "$SUCCESS_COUNT" -eq 100 ] && [ "$FAIL_COUNT" -eq 0 ]; then
    echo "✅ Collected: ${SUCCESS_COUNT} characters" | tee -a "$LOG_FILE"
    SUCCESS=$((SUCCESS + 1))
    TOTAL_CHARS=$((TOTAL_CHARS + SUCCESS_COUNT))
  else
    echo "❌ Failed: success=${SUCCESS_COUNT}, fail=${FAIL_COUNT}" | tee -a "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi

  echo "📊 Progress: ${TOTAL_CHARS} total collected" | tee -a "$LOG_FILE"
done

echo "" | tee -a "$LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
echo "🎉 All jobs processed!" | tee -a "$LOG_FILE"
echo "📊 Final Stats:" | tee -a "$LOG_FILE"
echo "   Success: ${SUCCESS}/${TOTAL_JOBS} jobs" | tee -a "$LOG_FILE"
echo "   Failed: ${FAILED}/${TOTAL_JOBS} jobs" | tee -a "$LOG_FILE"
echo "   Total Characters: ${TOTAL_CHARS}" | tee -a "$LOG_FILE"
echo "   Expected: $((TOTAL_JOBS * 100))" | tee -a "$LOG_FILE"
