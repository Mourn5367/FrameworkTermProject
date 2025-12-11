"""
DnF Insight RAG Tools
Spring Boot API를 호출하는 Function Calling용 도구 함수들
"""

import os
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime

# Spring Boot API Base URL
SPRING_BACKEND_URL = os.getenv("SPRING_BACKEND_URL", "http://backend:8080")


class DnfApiTools:
    """던파 인사이트 API 호출 도구 클래스 + Vector DB RAG"""

    def __init__(self):
        self.backend_url = SPRING_BACKEND_URL
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        # Vector DB 서비스 (lazy loading)
        self._info_service = None

    @property
    def info_service(self):
        """InfoPostService 인스턴스 (lazy loading)"""
        if self._info_service is None:
            from app.services.info_post_service import InfoPostService
            self._info_service = InfoPostService()
        return self._info_service

    def _analyze_time_patterns(self, snapshots: List[Dict]) -> Dict[str, Any]:
        """
        요일별/시간대별 가격 패턴 분석

        Args:
            snapshots: 시세 스냅샷 리스트

        Returns:
            요일별/시간대별 평균 가격 및 패턴 분석 결과
        """
        weekday_names = ["월", "화", "수", "목", "금", "토", "일"]
        weekday_prices = {day: [] for day in weekday_names}
        hour_prices = {
            "새벽(0-6시)": [],
            "오전(6-12시)": [],
            "오후(12-18시)": [],
            "저녁(18-24시)": []
        }

        # 스냅샷 데이터를 요일/시간대별로 분류
        for snapshot in snapshots:
            price = snapshot.get("currentAvgPrice")
            if not price or price == 0:
                continue

            try:
                # snapshotTime 파싱 (ISO 8601 형식)
                # 예: "2025-12-11T03:35:10.165197" 또는 "2025-12-11 03:35:10"
                time_str = snapshot.get("snapshotTime", "")
                if "T" in time_str:
                    dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                else:
                    dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")

                # 요일별 분류 (0=월요일, 6=일요일)
                weekday = weekday_names[dt.weekday()]
                weekday_prices[weekday].append(price)

                # 시간대별 분류
                hour = dt.hour
                if 0 <= hour < 6:
                    hour_prices["새벽(0-6시)"].append(price)
                elif 6 <= hour < 12:
                    hour_prices["오전(6-12시)"].append(price)
                elif 12 <= hour < 18:
                    hour_prices["오후(12-18시)"].append(price)
                else:
                    hour_prices["저녁(18-24시)"].append(price)
            except Exception:
                continue

        # 전체 평균 계산
        all_prices = [p for prices in weekday_prices.values() for p in prices]
        overall_avg = sum(all_prices) / len(all_prices) if all_prices else 0

        # 요일별 평균 및 변동률 계산
        weekday_analysis = {}
        for day, prices in weekday_prices.items():
            if prices:
                day_avg = sum(prices) / len(prices)
                change_pct = ((day_avg - overall_avg) / overall_avg * 100) if overall_avg > 0 else 0
                weekday_analysis[day] = {
                    "avgPrice": round(day_avg, 0),
                    "changePct": round(change_pct, 1),
                    "sampleCount": len(prices)
                }

        # 시간대별 평균 및 변동률 계산
        hour_analysis = {}
        for time_range, prices in hour_prices.items():
            if prices:
                hour_avg = sum(prices) / len(prices)
                change_pct = ((hour_avg - overall_avg) / overall_avg * 100) if overall_avg > 0 else 0
                hour_analysis[time_range] = {
                    "avgPrice": round(hour_avg, 0),
                    "changePct": round(change_pct, 1),
                    "sampleCount": len(prices)
                }

        # 최적 구매/판매 시점 찾기
        best_buy_day = min(weekday_analysis.items(), key=lambda x: x[1]["avgPrice"]) if weekday_analysis else None
        best_sell_day = max(weekday_analysis.items(), key=lambda x: x[1]["avgPrice"]) if weekday_analysis else None
        best_buy_time = min(hour_analysis.items(), key=lambda x: x[1]["avgPrice"]) if hour_analysis else None
        best_sell_time = max(hour_analysis.items(), key=lambda x: x[1]["avgPrice"]) if hour_analysis else None

        return {
            "weekdayPatterns": weekday_analysis,
            "hourPatterns": hour_analysis,
            "bestBuyDay": best_buy_day[0] if best_buy_day else None,
            "bestSellDay": best_sell_day[0] if best_sell_day else None,
            "bestBuyTime": best_buy_time[0] if best_buy_time else None,
            "bestSellTime": best_sell_time[0] if best_sell_time else None
        }

    async def get_equipment_stats(self, job_name: str) -> Dict[str, Any]:
        """
        직업별 장비 통계 조회 (전체 데이터)

        Args:
            job_name: 직업명 (예: "크루세이더", "웨펀마스터", "뮤즈")

        Returns:
            장비 통계 데이터 (무기 종류, 세트 아이템, 융합석, 스킬 등 전체)
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.backend_url}/api/stats/equipment/search",
                    params={"jobName": job_name}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return {
                        "success": False,
                        "error": f"'{job_name}' 직업의 장비 통계를 찾을 수 없습니다."
                    }

                # 전체 데이터 반환 (모든 필드 포함)
                return {
                    "success": True,
                    "jobName": data.get("jobGrowName"),
                    "totalCharacters": data.get("totalCharacters"),
                    "weaponTypes": data.get("weaponTypes", []),
                    "setItems": data.get("setItems", []),
                    "titles": data.get("titles", []),
                    "evolutionSkills": data.get("evolutionSkills", []),
                    "enhancementSkills": data.get("enhancementSkills", []),
                    "skillCombinations": data.get("skillCombinations", []),
                    "armorUpgrades": data.get("armorUpgrades", []),
                    "armorSetCombinations": data.get("armorSetCombinations", []),
                    "braceletUpgrades": data.get("braceletUpgrades", []),
                    "necklaceUpgrades": data.get("necklaceUpgrades", []),
                    "ringUpgrades": data.get("ringUpgrades", []),
                    "accessoryCombinations": data.get("accessoryCombinations", []),
                    "specialEquipmentUpgrades": data.get("specialEquipmentUpgrades", [])
                }
        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"API 오류 ({e.response.status_code}): {e.response.text}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"장비 통계 조회 실패: {str(e)}"
            }

    async def get_auction_price(self, item_name: str) -> Dict[str, Any]:
        """
        경매장 아이템 시세 조회 (최근 1개월 추이)

        Args:
            item_name: 아이템명 (예: "구슬", "블레싱")

        Returns:
            현재 가격, 판매량, 가격 추이 (한 달간)
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 1. 추적 아이템 목록 조회
                items_response = await client.get(
                    f"{self.backend_url}/api/auction/items"
                )
                items_response.raise_for_status()
                items = items_response.json()

                # 2. 아이템명으로 검색
                matched_item = None
                for item in items:
                    if item_name in item.get("itemName", ""):
                        matched_item = item
                        break

                if not matched_item:
                    return {
                        "success": False,
                        "error": f"'{item_name}' 아이템을 찾을 수 없습니다. 추적 중인 아이템이 아닐 수 있습니다."
                    }

                item_id = matched_item["itemId"]

                # 3. 최근 1개월 시세 스냅샷 조회 (43,200분 = 30일)
                snapshots_response = await client.get(
                    f"{self.backend_url}/api/auction/items/{item_id}/snapshots",
                    params={"interval": 43200}  # 30일
                )
                snapshots_response.raise_for_status()
                snapshots = snapshots_response.json()

                if not snapshots:
                    return {
                        "success": False,
                        "error": f"'{matched_item['itemName']}' 시세 정보가 없습니다."
                    }

                # 최신 스냅샷
                latest = snapshots[-1] if snapshots else {}

                # 가격 패턴 분석
                all_prices = [s.get("currentAvgPrice", 0) for s in snapshots if s.get("currentAvgPrice")]
                max_price = max(all_prices) if all_prices else 0
                min_price = min(all_prices) if all_prices else 0
                avg_price = sum(all_prices) / len(all_prices) if all_prices else 0

                # 전체 기간 가격 변동률
                price_change_pct = 0
                if len(snapshots) > 1 and all_prices:
                    first_price = all_prices[0]
                    latest_price = all_prices[-1]
                    if first_price > 0:
                        price_change_pct = ((latest_price - first_price) / first_price) * 100

                # 최근 1주일 가격 변동 (주간 패턴 분석)
                weekly_trend = "안정적"
                if len(snapshots) >= 7:
                    recent_week = all_prices[-7:]
                    week_avg = sum(recent_week) / len(recent_week)
                    if week_avg > avg_price * 1.05:
                        weekly_trend = "상승 추세"
                    elif week_avg < avg_price * 0.95:
                        weekly_trend = "하락 추세"

                # 변동성 계산 (표준편차 / 평균)
                volatility = 0
                if len(all_prices) > 1 and avg_price > 0:
                    variance = sum((p - avg_price) ** 2 for p in all_prices) / len(all_prices)
                    std_dev = variance ** 0.5
                    volatility = (std_dev / avg_price) * 100

                # 현재 가격 포지션 (최저가 대비 위치)
                price_position = "중간"
                current_price = latest.get("currentAvgPrice", 0)
                if current_price and max_price and min_price and (max_price - min_price) > 0:
                    position_pct = ((current_price - min_price) / (max_price - min_price)) * 100
                    if position_pct < 30:
                        price_position = "저가 구간 (하위 30%)"
                    elif position_pct > 70:
                        price_position = "고가 구간 (상위 30%)"

                # 총 판매량 계산
                total_sold = sum(s.get("soldCount", 0) for s in snapshots)

                # 주간 평균 판매량 (활성도 지표)
                weekly_avg_sold = total_sold / 4 if len(snapshots) >= 7 else 0  # 30일 ≈ 4주

                # 요일별/시간대별 패턴 분석
                time_patterns = self._analyze_time_patterns(snapshots)

                return {
                    "success": True,
                    "itemName": matched_item["itemName"],
                    # 현재 시세
                    "currentPrice": current_price,
                    "currentMinPrice": latest.get("currentMinPrice"),
                    "currentItemCount": latest.get("currentItemCount"),
                    # 한 달 통계
                    "monthlyMaxPrice": max_price,
                    "monthlyMinPrice": min_price,
                    "monthlyAvgPrice": round(avg_price, 0),
                    "priceChangePct": round(price_change_pct, 1),
                    # 가격 패턴 분석
                    "pricePosition": price_position,  # "저가 구간", "중간", "고가 구간"
                    "weeklyTrend": weekly_trend,  # "상승 추세", "안정적", "하락 추세"
                    "volatility": round(volatility, 1),  # 변동성 (%)
                    # 거래량 분석
                    "totalSoldCount": total_sold,
                    "weeklyAvgSold": round(weekly_avg_sold, 0),
                    "recentSoldCount": latest.get("soldCount", 0),
                    "recentSoldAvgPrice": latest.get("soldAvgPrice"),
                    # 요일/시간 패턴 분석
                    "weekdayPatterns": time_patterns.get("weekdayPatterns", {}),
                    "hourPatterns": time_patterns.get("hourPatterns", {}),
                    "bestBuyDay": time_patterns.get("bestBuyDay"),  # 가장 저렴한 요일
                    "bestSellDay": time_patterns.get("bestSellDay"),  # 가장 비싼 요일
                    "bestBuyTime": time_patterns.get("bestBuyTime"),  # 가장 저렴한 시간대
                    "bestSellTime": time_patterns.get("bestSellTime"),  # 가장 비싼 시간대
                    # 메타 정보
                    "snapshotCount": len(snapshots),
                    "snapshotTime": latest.get("snapshotTime")
                }
        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"API 오류 ({e.response.status_code}): {e.response.text}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"경매장 시세 조회 실패: {str(e)}"
            }

    async def search_character(self, server: str, character_name: str) -> Dict[str, Any]:
        """
        캐릭터 검색 및 정보 조회

        Args:
            server: 서버명 (예: "카인", "시로코", "디레지에")
            character_name: 캐릭터명

        Returns:
            명성, 직업, 주간 던전 현황
        """
        try:
            # 서버명 매핑 (한글 → 영어)
            server_map = {
                "카인": "cain",
                "디레지에": "diregie",
                "시로코": "siroco",
                "프레이": "prey",
                "카시야스": "casillas",
                "힐더": "hilder",
                "안톤": "anton",
                "바칼": "bakal"
            }
            server_id = server_map.get(server, server)

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 1. 캐릭터 검색
                search_response = await client.get(
                    f"{self.backend_url}/api/characters/search",
                    params={
                        "serverId": server_id,
                        "characterName": character_name
                    }
                )
                search_response.raise_for_status()
                char_data = search_response.json()

                if not char_data or "characterId" not in char_data:
                    return {
                        "success": False,
                        "error": f"'{server}' 서버에서 '{character_name}' 캐릭터를 찾을 수 없습니다."
                    }

                character_id = char_data["characterId"]

                # 2. 주간 던전 현황 조회
                dungeons_response = await client.get(
                    f"{self.backend_url}/api/characters/{server_id}/{character_id}/weekly-dungeons"
                )
                dungeons_response.raise_for_status()
                dungeons_data = dungeons_response.json()

                # 3. 접속 시간대 조회
                playtime_response = await client.get(
                    f"{self.backend_url}/api/characters/{server_id}/{character_id}/playtime"
                )
                playtime_response.raise_for_status()
                playtime_data = playtime_response.json()

                return {
                    "success": True,
                    "characterName": char_data.get("characterName"),
                    "jobName": char_data.get("jobName"),
                    "jobGrowName": char_data.get("jobGrowName"),
                    "fame": char_data.get("fame"),
                    "serverId": char_data.get("serverId"),
                    "adventureName": char_data.get("adventureName"),
                    "guildName": char_data.get("guildName"),
                    "weeklyDungeons": dungeons_data.get("dungeons", []),
                    "weekdayPeak": playtime_data.get("weekdayPeakHours"),
                    "weekendPeak": playtime_data.get("weekendPeakHours")
                }
        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"API 오류 ({e.response.status_code}): {e.response.text}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"캐릭터 조회 실패: {str(e)}"
            }

    def search_community_posts(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        커뮤니티 정보글 검색 (Vector DB RAG)

        Args:
            query: 검색 질의 (예: "웨펀마스터 빌드", "크루세이더 스킬", "골드 파밍 방법")
            top_k: 반환할 결과 수 (기본: 3)

        Returns:
            검색된 커뮤니티 게시글 목록 (추천수 가중치 적용)
        """
        try:
            results = self.info_service.search_posts(
                query=query,
                top_k=top_k,
                min_upvote=None  # 추천수 필터 없음
            )

            if not results:
                return {
                    "success": True,
                    "message": "검색 결과 없음 (Vector DB가 비어있을 수 있습니다)",
                    "posts": [],
                    "count": 0
                }

            # 결과 포맷팅
            posts = []
            for result in results:
                metadata = result['metadata']
                posts.append({
                    "title": metadata.get('title', ''),
                    "url": metadata.get('url', ''),
                    "upvoteCount": metadata.get('upvote_count', 0),
                    "viewCount": metadata.get('view_count', 0),
                    "similarity": round(result['similarity'], 3),
                    "boostedScore": round(result['boosted_score'], 3),
                    "snippet": result['document'][:200] + "..."  # 200자까지만
                })

            return {
                "success": True,
                "posts": posts,
                "count": len(posts),
                "query": query
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"커뮤니티 검색 실패: {str(e)}"
            }


# OpenAI Function Calling 형식의 Tool 정의
TOOLS_DEFINITION = [
    {
        "type": "function",
        "function": {
            "name": "get_equipment_stats",
            "description": "직업별 장비 통계를 조회합니다. 상위 랭킹 100명의 캐릭터 데이터를 기반으로 해당 직업의 인기 무기, 세트 아이템, 융합석, 스킬 조합을 확인할 수 있습니다. 빌드 추천이나 장비 관련 질문에 사용합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_name": {
                        "type": "string",
                        "description": "직업명 (예: '크루세이더', '웨펀마스터', '뮤즈', '인파이터')"
                    }
                },
                "required": ["job_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_auction_price",
            "description": "경매장 아이템의 최근 1개월 시세를 조회합니다. 실시간 가격, 등록 수량, 판매량, 가격 추이를 확인할 수 있습니다. 아이템 구매/판매 타이밍 관련 질문에 사용합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_name": {
                        "type": "string",
                        "description": "아이템명 (예: '구슬', '블레싱', '카드', '영약')"
                    }
                },
                "required": ["item_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_character",
            "description": "특정 캐릭터의 정보를 조회합니다. 명성, 직업, 주간 던전 클리어 현황, 접속 시간대 등을 확인할 수 있습니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "server": {
                        "type": "string",
                        "description": "서버명 (예: '카인', '시로코', '디레지에', '프레이', '카시야스', '힐더', '안톤', '바칼')"
                    },
                    "character_name": {
                        "type": "string",
                        "description": "캐릭터명"
                    }
                },
                "required": ["server", "character_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_community_posts",
            "description": "디시인사이드 '📚정보' 말머리 게시글을 검색합니다. 커뮤니티의 빌드 가이드, 팁, 공략 정보를 찾을 수 있습니다. 추천수가 높은 게시글일수록 우선 순위가 높습니다. 빌드, 스킬, 플레이 방법 등의 질문에 사용합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "검색 질의 (예: '웨펀마스터 빌드', '크루세이더 스킬 트리', '골드 파밍 방법', '장비 업그레이드 팁')"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "반환할 게시글 수 (기본: 3, 최대: 5)",
                        "default": 3
                    }
                },
                "required": ["query"]
            }
        }
    }
]
