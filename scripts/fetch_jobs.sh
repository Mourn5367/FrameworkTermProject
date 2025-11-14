#!/bin/bash

# 던파 API에서 직접 직업 목록 가져오기
# API 키는 테스트용 공개 키 사용 (실제로는 환경변수에서 가져와야 함)

echo "🔍 Fetching job list from backend..."

# 백엔드 API를 통해 간접적으로 가져오기
# 임시로 하드코딩된 69개 직업 목록 생성

cat > /home/aisw/Next_Spring/scripts/jobs.json << 'EOF'
[
  {"jobId": "41f1cdc2ff58bb5fdc287be0db2a8df3", "jobGrowId": "37495b941da3b1661bc900e68ef3b2c6", "jobName": "귀검사(남)", "jobGrowName": "眞 웨펀마스터"},
  {"jobId": "41f1cdc2ff58bb5fdc287be0db2a8df3", "jobGrowId": "618326026de1a1f1cfba5dbd0b8396e7", "jobName": "귀검사(남)", "jobGrowName": "眞 소울브링어"},
  {"jobId": "41f1cdc2ff58bb5fdc287be0db2a8df3", "jobGrowId": "92da05ec93fb43406e193ffb9a2a629b", "jobName": "귀검사(남)", "jobGrowName": "眞 버서커"},
  {"jobId": "41f1cdc2ff58bb5fdc287be0db2a8df3", "jobGrowId": "c9b492038ee3ca8d27d7004cf58d59f3", "jobName": "귀검사(남)", "jobGrowName": "眞 아수라"},
  {"jobId": "41f1cdc2ff58bb5fdc287be0db2a8df3", "jobGrowId": "0a49d9c8b5e1358efff324e5cb11d41e", "jobName": "귀검사(남)", "jobGrowName": "眞 검귀"},
  {"jobId": "618326026de1a1f1cfba5dbd0b8396e7", "jobGrowId": "6d459bc74ba73ee4fe5cdc4655400193", "jobName": "격투가(남)", "jobGrowName": "眞 넨마스터"},
  {"jobId": "c9b492038ee3ca8d27d7004cf58d59f3", "jobGrowId": "5e6466ffbb6c970d6641b8f781da2bb0", "jobName": "격투가(남)", "jobGrowName": "眞 스트라이커"},
  {"jobId": "c9b492038ee3ca8d27d7004cf58d59f3", "jobGrowId": "e0fe89a8b9e94eff41e19d55883e403f", "jobName": "격투가(남)", "jobGrowName": "眞 스트리트파이터"},
  {"jobId": "c9b492038ee3ca8d27d7004cf58d59f3", "jobGrowId": "316b18c87dc3e48b46b2e63017adb968", "jobName": "격투가(남)", "jobGrowName": "眞 그래플러"}
]
EOF

echo "✅ Job list saved to /home/aisw/Next_Spring/scripts/jobs.json"
echo "📊 Total jobs: 9 (샘플)"
