
import { GoogleGenAI } from "@google/genai";
import { Market, StockAnalysis, MarketSentiment, TimeRange } from "../types";

// Initialize Gemini Client
// NOTE: In a real production app, this key should be proxied.
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_ID = "gemini-2.5-flash";

/**
 * Helper to parse JSON from Markdown code blocks often returned by LLMs
 */
function extractJson(text: string): any {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from ```json block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try extracting from ``` block
    const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch && codeMatch[1]) {
      return JSON.parse(codeMatch[1]);
    }
    throw new Error("Failed to parse JSON response");
  }
}

/**
 * Enhanced error handler to detect 429 and other common issues
 */
function handleGeminiError(error: any): never {
  console.error("Gemini API Error Detail:", error);
  
  // Check for standard Gemini 429 structure
  if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('RESOURCE_EXHAUSTED'))) {
    const enhancedError = new Error("API Quota Exceeded (429). Please wait a moment before retrying.");
    (enhancedError as any).status = 429;
    throw enhancedError;
  }

  throw error;
}

export const analyzeStockWithGemini = async (
  symbol: string,
  name: string,
  market: Market
): Promise<StockAnalysis> => {
  // Inject current time to force fresh data
  const now = new Date().toLocaleString('zh-CN');

  // Updated prompt to request Chinese output and detailed Value Investing analysis
  const prompt = `
    当前时间是: ${now}。
    你是一位精通价值投资（本杰明·格雷厄姆）、深度价值（沃尔特·施洛斯）和成长股投资（菲利普·费雪）的资深金融分析师。

    重要提示：必须使用 Google Search 获取 *此刻* 最新的实时数据。严禁使用训练数据中的过时价格。如果市场已收盘，请使用最近一个交易日的收盘数据。

    任务：
    1. 使用 Google Search 搜索最新的实时财务数据：
       股票名称：${name}
       代码：${symbol}
       市场：${market}
       
       需要的数据：
       - 实时股价 (Current Price)
       - 货币单位 (Currency)
       - 市盈率 TTM (PE TTM)
       - 动态市盈率/预测市盈率 (Forward PE / Dynamic PE)
       - 市净率 (PB)
       - 股息率 (Dividend Yield %)
       - 总市值 (Market Cap)
       - 近期营收增长率 (Revenue Growth YoY)
       - 净利润趋势
       - 负债权益比 (Debt to Equity)
       - 每股净资产 (Book Value Per Share)

    2. 根据获取的数据进行深度分析 (请用中文回答)：
       
       A. 本杰明·格雷厄姆 (Benjamin Graham - 价值投资):
          - 计算格雷厄姆数字 (Sqrt(22.5 * EPS * Book Value))。
          - 评估 PE 是否 < 15 且 PB < 1.5？
          - 评估安全边际 (Margin of Safety)。
       
       B. 沃尔特·施洛斯 (Walter Schloss - 深度价值):
          - 股价是否处于5年低点？
          - 股价是否低于每股净资产？
          - 债务水平是否较低？
       
       C. 菲利普·费雪 (Philip Fisher - 成长性):
          - "闲聊法" (Scuttlebutt)：营收增长是否稳健？
          - 利润率变化趋势。
          - 未来的高成长催化剂是什么？

    3. 计算目标价格 (根据你的专家判断):
       - 内在价值 (Intrinsic Value - 保守估计)
       - 买入价 (Buy Price - 例如内在价值的7折，安全边际)
       - 加仓价 (Add Position Price - 强力支撑位)
       - 止盈价 (Sell Price - 高估区域)
       - 止损价 (Stop Loss - 基本面恶化或技术破位)

    4. 输出格式：
       请仅返回一个纯 JSON 对象 (不要包含 markdown 格式之外的多余文字)，结构如下：
       {
         "currentPrice": number,
         "currency": "string (例如 CNY, HKD, USD)",
         "peTTM": number (or null),
         "peForward": number (or null),
         "pb": number (or null),
         "dividendYield": number (百分比, 例如 3.5),
         "marketCap": "string (例如 2.5万亿 HKD)",
         "revenueGrowth": "string (简述, 例如 '同比增长15%')",
         "intrinsicValue": number,
         "buyPrice": number,
         "addPositionPrice": number,
         "sellPrice": number,
         "stopLossPrice": number,
         "recommendation": "BUY" | "SELL" | "HOLD" | "WAIT",
         "reasoning": "中文简述你的核心投资逻辑 (50字左右)",
         "graham": { "score": number(0-100), "summary": "中文评价", "keyPoints": ["中文要点1", "中文要点2"] },
         "schloss": { "score": number(0-100), "summary": "中文评价", "keyPoints": ["中文要点1", "中文要点2"] },
         "fisher": { "score": number(0-100), "summary": "中文评价", "keyPoints": ["中文要点1", "中文要点2"] }
       }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for more factual data
      },
    });

    const text = response.text;
    
    if (!text) throw new Error("Gemini 未返回数据");

    const parsedData = extractJson(text);
    
    // Extract grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "",
      }))
      .filter((s: any) => s.uri !== "");

    return {
      ...parsedData,
      lastUpdated: new Date().toLocaleTimeString('zh-CN'),
      sources,
    };

  } catch (error) {
    handleGeminiError(error);
    // This return is unreachable but TS likes it
    throw error;
  }
};

export const getStockHistory = async (
  symbol: string, 
  name: string, 
  range: TimeRange
): Promise<{time: string, price: number}[]> => {
  const now = new Date().toLocaleString('zh-CN');
  const rangeMap: Record<string, string> = {
    '1D': '今天 (Today/Intraday)',
    '1W': '过去一周 (Past 1 Week)',
    '1M': '过去一个月 (Past 1 Month)',
    '1Q': '过去一个季度 (Past 3 Months)',
    '1Y': '过去一年 (Past 1 Year)'
  };

  const prompt = `
    Current Time: ${now}
    Task: Search and retrieve the historical price trend for stock: ${name} (${symbol}).
    Time Range: ${rangeMap[range]}

    Please return a JSON array of approximately 10-20 data points representing the price trend.
    Each point should have:
    - "time": string (Format: "HH:MM" for 1D, "MM-DD" for 1W/1M/1Q, "YYYY-MM" for 1Y)
    - "price": number

    Output ONLY the JSON array.
    Example: [{"time": "10:00", "price": 100.5}, {"time": "11:00", "price": 101.2}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) return [];
    return extractJson(text);
  } catch (error) {
    console.error("History Fetch Error (Non-critical):", error);
    return [];
  }
};

export const getMarketOverview = async (range: TimeRange = '1D'): Promise<MarketSentiment[]> => {
  const now = new Date().toLocaleString('zh-CN');
  
  const rangePromptMap: Record<string, string> = {
    '1D': '今天 (Today/Intraday)',
    '1W': '过去一周 (Last 1 Week)',
    '1M': '过去一个月 (Last 1 Month)',
    '1Q': '过去一个季度 (Last 3 Months)',
    '1Y': '过去一年 (Last 1 Year)'
  };

  const prompt = `
    当前时间是: ${now}。
    请作为金融市场分析师，搜索并返回当前以下主要市场的行情、市场情绪以及趋势数据。
    
    时间范围要求: ${rangePromptMap[range] || '今天'}
    
    需要覆盖的指数：
    1. 中国 (CN): 上证指数 (Shanghai Composite), 沪深300 (CSI 300)
    2. 香港 (HK): 恒生指数 (Hang Seng Index), 恒生科技指数 (Hang Seng Tech)
    3. 美国 (US): 标普500 (S&P 500), 纳斯达克 (Nasdaq), 道琼斯 (DJIA)

    对于每个指数，请基于 "${rangePromptMap[range] || '今天'}" 这一时间范围，生成大约 8-12 个关键数据点(Time, Value) 用于绘制简易趋势图。
    - 如果是 1D，返回今日分时关键点。
    - 如果是 1W/1M/1Q/1Y，返回每日、每周或每月收盘关键点。

    请返回一个纯 JSON 数组，不要包含 Markdown 格式。每个区域一个对象。
    JSON 格式如下:
    [
      {
        "region": "CN",
        "sentiment": "Bullish" | "Bearish" | "Neutral", (Bullish=看多, Bearish=看空, Neutral=中性)
        "summary": "一句话中文市场简评",
        "indices": [
          { 
            "name": "上证指数", 
            "value": "3000.12", 
            "change": "+12.3", 
            "changePercent": "+0.41%", 
            "isUp": true,
            "history": [
               {"time": "09:30", "value": 2990}, 
               {"time": "10:30", "value": 3005},
               ...
            ] 
          },
          ...
        ]
      },
      ... (HK, US)
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return extractJson(text);
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};
