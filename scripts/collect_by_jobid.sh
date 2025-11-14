#!/bin/bash

# ========================================
# 던파 캐릭터 장비 jobId 단위 병렬 수집 스크립트
# 17개 jobId × (각 jobId의 모든 jobGrowId 병렬 처리)
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JOBS_FILE="${SCRIPT_DIR}/all_jobs.json"
LOG_FILE="${SCRIPT_DIR}/collection_jobid_$(date +%Y%m%d_%H%M%S).log"
API_URL="http://localhost:8080/api/ranking/collect-by-jobid"

echo "🚀 Starting jobId-based parallel collection..." | tee -a "$LOG_FILE"
echo "📝 Log file: ${LOG_FILE}" | tee -a "$LOG_FILE"
echo ""

# Python으로 jobId별로 그룹화하여 순차적으로 처리
python3 << 'PYEOF'
import json
import requests
import sys
from collections import defaultdict

# JSON 로드
with open('/home/aisw/Next_Spring/scripts/all_jobs.json', 'r', encoding='utf-8') as f:
    jobs = json.load(f)

# jobId별로 그룹화
job_groups = defaultdict(list)
for job in jobs:
    job_groups[job['jobId']].append(job)

total_groups = len(job_groups)
current = 0
total_success = 0
total_fail = 0

print(f"Total jobId groups: {total_groups}\n")

# 각 jobId 그룹을 순차적으로 처리 (그룹 내에서는 병렬)
for job_id, job_list in job_groups.items():
    current += 1
    job_name = job_list[0]['jobName']

    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"[{current}/{total_groups}] {job_name} ({len(job_list)} jobs in parallel)")

    # API 호출
    response = requests.post(
        'http://localhost:8080/api/ranking/collect-by-jobid',
        json=job_list,
        headers={'Content-Type': 'application/json'}
    )

    if response.status_code == 200:
        result = response.json()
        success = result.get('successCount', 0)
        fail = result.get('failCount', 0)
        total_success += success
        total_fail += fail
        print(f"✅ Success: {success}, Fail: {fail}")
    else:
        print(f"❌ API Error: {response.status_code}")
        total_fail += len(job_list) * 100

print("")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("🎉 All jobId groups processed!")
print(f"📊 Final Stats:")
print(f"   Total Success: {total_success}")
print(f"   Total Fail: {total_fail}")
print(f"   Expected: 6900")
PYEOF
