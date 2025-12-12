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

    async def query(
        self,
        user_question: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        사용자 질문에 대한 RAG 응답 생성

        Args:
            user_question: 사용자 질문
            chat_history: 채팅 히스토리 (선택 사항)
                [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]

        Returns:
            LLM 응답 및 사용된 도구 정보
        """
        messages = [
            {
                "role": "system",
                "content": """당신은 던파(던전앤파이터) 전문 AI 어시스턴트입니다.

사용 가능한 도구:
- search_community_posts: 커뮤니티에서 크롤링한 게시글 검색 (공략, 빌드, 팁, 이벤트 정보 등)

사용자 질문을 분석하여 search_community_posts 도구를 사용해 관련 게시글을 찾고, 그 내용을 바탕으로 답변하세요.

중요:
- 던전 공략, 직업 빌드, 게임 팁 등 모든 질문에 search_community_posts 사용
- 검색된 게시글의 내용을 요약해서 답변
- 답변 마지막에 반드시 출처 URL을 표기 (예: "출처: https://...")
- 답변은 반드시 한국어로, 친절하고 자세하게 작성
- 검색 결과가 없으면 "관련 정보를 찾을 수 없습니다"라고 안내
"""
            }
        ]

        # 채팅 히스토리가 있으면 추가 (최근 10개만)
        if chat_history:
            recent_history = chat_history[-10:]
            for msg in recent_history:
                messages.append({
                    "role": msg.get("role"),
                    "content": msg.get("content")
                })

        # 현재 사용자 질문 추가
        messages.append({
            "role": "user",
            "content": user_question
        })

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
                        "stream": False,
                        "options": {
                            "num_predict": 100000,  # 최대 생성 토큰 수
                            "temperature": 0.3,   # 창의성 (0.0~1.0)
                        }
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
            if function_name == "search_community_posts":
                return self.tools.search_community_posts(
                    query=arguments.get("query", ""),
                    top_k=arguments.get("top_k", 5)
                )
            else:
                return {
                    "success": False,
                    "error": f"알 수 없는 함수: {function_name}"
                }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"도구 실행 실패: {str(e)}"
            }
