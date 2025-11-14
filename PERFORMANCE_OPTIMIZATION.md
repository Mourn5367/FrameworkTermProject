# 던파 인사이트 - 데이터 수집 성능 최적화

## 📊 최종 성과

| 항목 | 이전 (순차 처리) | 최종 (3단계 병렬) | 개선율 |
|------|-----------------|------------------|--------|
| **6,900명 수집 시간** | ~9분 | **2분 13초** | **4배 빠름** |
| **1개 직업 (100명)** | ~8초 | **3.1초** | **2.6배 빠름** |
| **실패율** | N/A | **0%** | **완벽** |

## 🎯 문제 상황

### 초기 구조 (순차 처리)
```
캐릭터1 장비 API → 캐릭터1 스킬 API → 저장
캐릭터2 장비 API → 캐릭터2 스킬 API → 저장
캐릭터3 장비 API → 캐릭터3 스킬 API → 저장
...
```

**문제점:**
- 각 API 호출이 순차적으로 실행되어 네트워크 I/O 대기 시간 낭비
- 69개 직업 × 100명 × 2 API = 13,800번 호출을 순차 처리
- CPU는 놀고 있는데 네트워크 응답만 기다림

## 🚀 해결 방법: 3단계 병렬 처리

### 1단계: 장비 + 스킬 API 병렬 호출
**파일:** `EquipmentService.java:91-133`

**Before:**
```java
// 순차 처리 (2배 시간 소요)
EquipmentResponse equip = dnfApiClient.getEquipment(serverId, characterId);
SkillStyleResponse skill = dnfApiClient.getSkillStyle(serverId, characterId);
```

**After:**
```java
// 병렬 처리 (2배 빠름)
CompletableFuture<EquipmentResponse> equipFuture = CompletableFuture.supplyAsync(() ->
    dnfApiClient.getEquipment(serverId, characterId)
);

CompletableFuture<SkillStyleResponse> skillFuture = CompletableFuture.supplyAsync(() ->
    dnfApiClient.getSkillStyle(serverId, characterId)
);

// 두 API가 모두 완료될 때까지 대기
CompletableFuture.allOf(equipFuture, skillFuture).join();

EquipmentResponse equip = equipFuture.join();
SkillStyleResponse skill = skillFuture.join();
```

**핵심 개념:**
- `CompletableFuture.supplyAsync()`: 별도 스레드에서 비동기 실행
- `allOf().join()`: 여러 작업이 모두 완료될 때까지 블로킹
- 네트워크 I/O 대기 시간 동안 다른 API도 함께 호출

### 2단계: 100명 병렬 수집
**파일:** `RankingService.java:127-173`

**Before:**
```java
// 순차 처리 (100번 반복)
for (Character character : topCharacters) {
    equipmentService.saveEquipment(...);  // 8초
}
// 총 800초 (13분)
```

**After:**
```java
// 병렬 처리 (100명 동시)
List<CompletableFuture<CharacterEquipment>> futures = topCharacters.stream()
    .map(character -> CompletableFuture.supplyAsync(() ->
        equipmentService.saveEquipment(...)  // 각각 병렬 실행
    ))
    .collect(Collectors.toList());

// 모두 완료 대기
CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
// 총 3.1초
```

**핵심 개념:**
- Stream API로 100명을 CompletableFuture 리스트로 변환
- 각 캐릭터마다 별도 스레드에서 수집
- 100명이 거의 동시에 처리됨 (스레드 풀 크기에 따라 제한)

### 3단계: jobId 그룹 병렬 수집
**파일:** `RankingService.java:179-234`

**Before:**
```java
// 순차 처리 (69개 직업)
for (Job job : jobs) {
    collectEquipmentsForJob(job);  // 3.1초
}
// 총 213초 (3.5분)
```

**After:**
```java
// jobId 그룹별 병렬 처리
// 예) 귀검사(남) 5개 직업을 동시에 수집
List<CompletableFuture<CollectionResult>> futures = jobs.stream()
    .map(job -> CompletableFuture.supplyAsync(() ->
        collectEquipmentsForJob(...)  // 5개 동시 실행
    ))
    .collect(Collectors.toList());

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
// 17개 jobId 그룹 순차 처리: 17 × ~8초 = 136초 (2분 16초)
```

**핵심 개념:**
- 같은 jobId의 여러 jobGrowId를 동시에 처리
- 예: 귀검사(남) 5개 직업 × 100명 = 500명을 3초에 수집
- API Rate Limit 고려: 5 × 100 × 2 = 1000 API (초당 제한 이내)

## 🏗️ 최종 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ collect_by_jobid.sh (Bash Script)                           │
│ 17개 jobId 그룹을 순차적으로 처리                             │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ RankingService.collectEquipmentsByJobId()                   │
│ 1개 jobId의 여러 jobGrowId를 병렬 처리 (3단계 병렬)           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │웨폰마스터    │  │소울브링어    │  │버서커        │     │
│  │100명 병렬    │  │100명 병렬    │  │100명 병렬    │  ···│
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         │ (동시 실행)      │                  │              │
│         ▼                  ▼                  ▼              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ RankingService.collectEquipmentsForJob()                    │
│ 100명의 캐릭터를 병렬 처리 (2단계 병렬)                       │
│                                                              │
│  ┌─────┐  ┌─────┐  ┌─────┐           ┌─────┐              │
│  │캐1  │  │캐2  │  │캐3  │    ...    │캐100│              │
│  └──┬──┘  └──┬──┘  └──┬──┘           └──┬──┘              │
│     │        │        │                  │                  │
│     │ (동시 실행)                         │                  │
│     ▼        ▼        ▼                  ▼                  │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ EquipmentService.saveEquipment()                            │
│ 1명의 장비 + 스킬 API를 병렬 처리 (1단계 병렬)                │
│                                                              │
│         장비 API  ↘                                          │
│                    → 동시 호출 → 2배 빠름                    │
│         스킬 API  ↗                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📝 핵심 코드 위치

| 파일 | 라인 | 설명 |
|------|------|------|
| `EquipmentService.java` | 91-133 | 1단계: 장비+스킬 API 병렬 호출 |
| `RankingService.java` | 127-173 | 2단계: 100명 병렬 수집 |
| `RankingService.java` | 179-234 | 3단계: jobId 그룹 병렬 수집 |
| `RankingController.java` | 72-104 | REST API 엔드포인트 |
| `collect_by_jobid.sh` | 전체 | Bash 스크립트 (Python 포함) |
| `CharacterEquipmentRepository.java` | 44-49 | jobId+jobGrowId 필터링 |

## ⚙️ 기술 스택

### CompletableFuture
- **역할**: Java 8의 비동기 프로그래밍 API
- **사용 이유**:
  - 간단한 API로 병렬 처리 구현
  - ForkJoinPool 기본 제공 (별도 스레드 풀 불필요)
  - 예외 처리 및 결과 조합 용이

### Stream API
- **역할**: 컬렉션 데이터를 함수형으로 처리
- **사용 이유**:
  - `map()`으로 각 요소를 CompletableFuture로 변환
  - `collect()`로 List로 수집
  - 간결하고 읽기 쉬운 코드

### ForkJoinPool
- **역할**: CompletableFuture의 기본 스레드 풀
- **특징**:
  - 기본 크기: CPU 코어 수 - 1
  - Work Stealing 알고리즘으로 효율적 분산
  - 자동으로 관리되므로 별도 설정 불필요

## 🛡️ API Rate Limit 고려사항

### 네오플 API 제한
- **초당**: 1,000건
- **분당**: 60,000건
- **시간당**: 3,600,000건

### 실제 사용량 (귀검사(남) 예시)
```
5개 직업 × 100명 × 2 API = 1,000 API 호출
소요 시간: 약 3초
초당 요청: 1000 / 3 = 333 req/sec ✅ (안전)
```

### 다중 API 키 자동 전환
- `ApiKeyManager`에서 Rate Limit 초과 시 자동으로 다음 키로 전환
- Redis Sliding Window 방식으로 정확한 카운팅

## 🐛 주요 이슈 및 해결

### Issue 1: jobGrowId 중복
**문제**: jobGrowId가 여러 jobId에서 반복되어 삭제 시 다른 직업 데이터도 함께 삭제됨

**해결**:
```java
// Before: jobGrowId만으로 삭제
deleteByJobGrowId(String jobGrowId)

// After: jobId + jobGrowId 조합으로 삭제
deleteByJobIdAndJobGrowId(String jobId, String jobGrowId)
```

**파일**: `CharacterEquipmentRepository.java:44-49`

### Issue 2: all_jobs.json 중복 데이터
**문제**: 수동으로 생성한 직업 리스트에 중복 및 오류

**해결**:
- 네오플 API에서 직접 가져와서 재생성
- Python으로 재귀적으로 眞 직업만 추출
- 69개 유니크한 직업 확보

## 📊 성능 측정 결과

### 1개 직업 (100명) 수집 시간
```bash
# Before (순차): ~8초
# After (병렬): 3.1초

time curl -X POST "http://localhost:8080/api/ranking/collect?..."
# real: 0m3.129s
```

### 전체 (6,900명) 수집 시간
```bash
time bash /home/aisw/Next_Spring/scripts/collect_by_jobid.sh
# Total Success: 6900
# Total Fail: 0
# real: 2m13.193s
```

## 🚀 사용 방법

### 1. 단일 직업 수집
```bash
curl -X POST "http://localhost:8080/api/ranking/collect?jobId=41f1cdc2...&jobGrowId=37495b94...&jobName=귀검사(남)&jobGrowName=眞 웨폰마스터"
```

### 2. jobId 그룹 수집
```bash
curl -X POST "http://localhost:8080/api/ranking/collect-by-jobid" \
  -H "Content-Type: application/json" \
  -d '[
    {"jobId":"41f1cdc2...","jobGrowId":"37495b94...","jobName":"귀검사(남)","jobGrowName":"眞 웨폰마스터"},
    {"jobId":"41f1cdc2...","jobGrowId":"618326026...","jobName":"귀검사(남)","jobGrowName":"眞 소울브링어"}
  ]'
```

### 3. 전체 수집 (권장)
```bash
bash /home/aisw/Next_Spring/scripts/collect_by_jobid.sh
```

## 📈 향후 개선 가능 사항

### 1. 커스텀 Executor 사용
```java
// 동시 처리 수를 명시적으로 제한
Executor executor = Executors.newFixedThreadPool(20);
CompletableFuture.supplyAsync(() -> {...}, executor)
```

**장점**: API Rate Limit 더 정밀하게 제어 가능

### 2. Bulk Insert 적용
```java
// 100개를 1개씩 insert 대신
List<CharacterEquipment> equipments = ...;
equipmentRepository.saveAll(equipments);  // Bulk insert
```

**예상 효과**: 추가로 20-30% 속도 개선

### 3. WebClient Connection Pool 최적화
```java
ConnectionProvider provider = ConnectionProvider.builder("custom")
    .maxConnections(100)
    .pendingAcquireMaxCount(1000)
    .build();
```

**예상 효과**: 약 10-20% 속도 개선

## 📚 참고 자료

- [CompletableFuture 공식 문서](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)
- [네오플 API 문서](https://developers.neople.co.kr)
- [ForkJoinPool](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html)

---

**작성일**: 2025-01-14
**작성자**: DnF Insight Team
**버전**: 1.0.0
