"""
LLM Service with Function Calling
Ollama Gemma3:4b를 사용한 RAG 질의응답 서비스
"""

import os
import json
import httpx
from typing import Dict, Any, List, Optional
from .tools import DnfApiTools, TOOLS_DEFINITION

# Ollama API URL
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://ollama:11434")


class LLMService:
    """Ollama Gemma3:4b Function Calling 서비스"""

    def __init__(self):
        self.ollama_url = OLLAMA_API_URL
        self.model = "qwen3:4b"
        self.tools = DnfApiTools()
        self.timeout = httpx.Timeout(120.0, connect=10.0)  # LLM 응답 대기 시간 길게
        self.max_iterations = 5  # Function Calling 최대 반복 횟수

    async def query(self, user_question: str) -> Dict[str, Any]:
        """
        사용자 질문에 대한 RAG 응답 생성

        Args:
            user_question: 사용자 질문

        Returns:
            LLM 응답 및 사용된 도구 정보
        """
        messages = [
            {
                "role": "system",
                "content": """당신은 던파(던전앤파이터) 전문 AI 어시스턴트입니다.

사용 가능한 도구:
1. get_equipment_stats: 직업별 장비 통계 조회 (상위 100명 기준)
2. get_auction_price: 경매장 아이템 시세 조회 (30일 추이, 요일/시간 패턴 포함)
3. search_character: 캐릭터 검색 및 정보 조회

사용자 질문을 분석하여 적절한 도구를 선택하고, 도구 실행 결과를 바탕으로 자연스러운 답변을 생성하세요.

중요:
- 빌드/장비 관련 질문 → get_equipment_stats 사용
- 경매장/시세/구매 타이밍 질문 → get_auction_price 사용 (요일/시간 패턴 활용)
- 캐릭터 정보 질문 → search_character 사용
- 답변은 한국어로, 친절하고 자세하게 작성
- 통계 데이터는 구체적인 수치와 함께 설명
"""
            },
            {
                "role": "user",
                "content": user_question
            }
        ]

        iteration = 0
        tool_calls_history = []

        while iteration < self.max_iterations:
            iteration += 1

            # LLM에게 질문 (도구 선택 요청)
            llm_response = await self._call_ollama(messages)

            # LLM이 최종 답변을 생성한 경우
            if not llm_response.get("tool_calls"):
                return {
                    "success": True,
                    "answer": llm_response.get("content", ""),
                    "toolCallsHistory": tool_calls_history,
                    "iterations": iteration
                }

            # Function Calling: 도구 실행
            tool_calls = llm_response.get("tool_calls", [])
            tool_results = []

            for tool_call in tool_calls:
                function_name = tool_call.get("function", {}).get("name")
                arguments = tool_call.get("function", {}).get("arguments", {})

                # 도구 실행
                result = await self._execute_tool(function_name, arguments)
                tool_results.append({
                    "function": function_name,
                    "arguments": arguments,
                    "result": result
                })

                # 대화 히스토리에 도구 실행 결과 추가
                messages.append({
                    "role": "tool",
                    "content": json.dumps(result, ensure_ascii=False)
                })

            tool_calls_history.extend(tool_results)

        # 최대 반복 횟수 초과
        return {
            "success": False,
            "error": "최대 반복 횟수를 초과했습니다. 질문을 더 명확하게 작성해주세요.",
            "toolCallsHistory": tool_calls_history,
            "iterations": iteration
        }

    async def _call_ollama(self, messages: List[Dict]) -> Dict[str, Any]:
        """
        Ollama API 호출 (Function Calling 지원)

        Args:
            messages: 대화 히스토리

        Returns:
            LLM 응답 (tool_calls 포함 가능)
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Ollama Chat API 호출
                url = f"{self.ollama_url}/api/chat"
                print(f"🔍 Ollama 요청: {url}")
                print(f"📦 Request model: {self.model}")

                response = await client.post(
                    url,
                    json={
                        "model": self.model,
                        "messages": messages,
                        "tools": TOOLS_DEFINITION,
                        "stream": False
                    }
                )

                print(f"📡 Ollama 응답 코드: {response.status_code}")

                response.raise_for_status()
                data = response.json()

                # 응답 파싱
                message = data.get("message", {})
                return {
                    "content": message.get("content", ""),
                    "tool_calls": message.get("tool_calls", [])
                }
        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP 오류: {e.response.status_code}")
            print(f"❌ 응답 내용: {e.response.text}")
            return {
                "content": f"LLM API 오류: {e.response.status_code} - {e.response.text[:200]}",
                "tool_calls": []
            }
        except Exception as e:
            print(f"❌ 예외 발생: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "content": f"LLM 호출 실패: {str(e)}",
                "tool_calls": []
            }

    async def _execute_tool(self, function_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        도구 함수 실행

        Args:
            function_name: 함수명
            arguments: 함수 인자

        Returns:
            함수 실행 결과
        """
        try:
            if function_name == "get_equipment_stats":
                return await self.tools.get_equipment_stats(
                    job_name=arguments.get("job_name", "")
                )
            elif function_name == "get_auction_price":
                return await self.tools.get_auction_price(
                    item_name=arguments.get("item_name", "")
                )
            elif function_name == "search_character":
                return await self.tools.search_character(
                    server=arguments.get("server", ""),
                    character_name=arguments.get("character_name", "")
                )
            elif function_name == "search_community_posts":
                return self.tools.search_community_posts(
                    query=arguments.get("query", ""),
                    top_k=arguments.get("top_k", 3)
                )
            else:
                return {
                    "success": False,
                    "error": f"알 수 없는 함수: {function_name}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"도구 실행 실패: {str(e)}"
            }
