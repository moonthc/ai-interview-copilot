/**
 * 从 AI 响应中提取 JSON 对象
 * 处理 markdown 代码块包裹、前后非 JSON 文字等情况
 */
export function extractJsonFromAIResponse<T>(response: string): T {
  let jsonStr = response.trim();

  // 提取 markdown 代码块中的 JSON
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // 找到第一个 { 或 [ 和最后一个 } 或 ]
  const firstBrace = jsonStr.indexOf("{");
  const firstBracket = jsonStr.indexOf("[");
  let jsonStart = -1;

  if (firstBrace === -1) jsonStart = firstBracket;
  else if (firstBracket === -1) jsonStart = firstBrace;
  else jsonStart = Math.min(firstBrace, firstBracket);

  const lastBrace = jsonStr.lastIndexOf("}");
  const lastBracket = jsonStr.lastIndexOf("]");
  const jsonEnd = Math.max(lastBrace, lastBracket);

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
  }

  return JSON.parse(jsonStr) as T;
}
