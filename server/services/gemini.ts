import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AIAnalysis {
  domain: string;
  category: string;
  urgency: string;
  priority: string;
  severity: string;
  confidence: number;
  reasoning: string;
  estimatedCost: string;
  timeToResolve: string;
  riskLevel: string;
}

export async function analyzeMaintenanceIssue(
  description: string,
  imageBase64?: string
): Promise<AIAnalysis> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("No Gemini API key found, using fallback analysis");
      return fallbackAnalysis(description);
    }

    const prompt = `You are an expert facility maintenance analyst with 20+ years of experience. Analyze this maintenance issue comprehensively using BOTH the image and description provided.

DESCRIPTION: "${description}"

ANALYSIS INSTRUCTIONS:
1. Examine the uploaded image carefully for visual evidence of the maintenance issue
2. Use the description to provide context, but prioritize what you can see in the image
3. Look for visual indicators of damage, wear, malfunction, or safety hazards
4. Assess the severity based on visual evidence in the image

DOMAINS: Plumbing, Electrical, HVAC, Structural, Fire Safety, Security, IT/Technology, Landscaping, Cleaning, General Maintenance

URGENCY (Response Time):
- IMMEDIATE: 0-2 hours (life safety, major system failure)
- URGENT: 2-24 hours (significant operational impact)
- STANDARD: 1-7 days (normal maintenance)
- ROUTINE: 1-4 weeks (preventive/cosmetic)

PRIORITY (Business Impact):
- CRITICAL: Safety/security/core operations affected
- HIGH: Significant operational disruption
- MEDIUM: Moderate operational impact
- LOW: Minor inconvenience/aesthetic

SEVERITY (Risk Level):
- CRITICAL: Immediate danger/major system failure
- HIGH: Potential safety risk/significant damage
- MEDIUM: Moderate impact/minor safety concerns
- LOW: Minimal impact/cosmetic issues

RISK LEVEL: LOW, MEDIUM, HIGH, CRITICAL

Base your analysis primarily on what you observe in the image. Respond with valid JSON only:
{
  "domain": "primary_domain",
  "category": "specific_subcategory",
  "urgency": "IMMEDIATE|URGENT|STANDARD|ROUTINE",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "confidence": 0.95,
  "reasoning": "Detailed analysis based on visual evidence in the image and description context",
  "estimatedCost": "$50-100",
  "timeToResolve": "2-4 hours",
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            domain: { type: "string" },
            category: { type: "string" },
            urgency: { type: "string" },
            priority: { type: "string" },
            severity: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            estimatedCost: { type: "string" },
            timeToResolve: { type: "string" },
            riskLevel: { type: "string" },
          },
          required: [
            "domain",
            "category",
            "urgency",
            "priority",
            "severity",
            "confidence",
            "reasoning",
            "estimatedCost",
            "timeToResolve",
            "riskLevel",
          ],
        },
      },
    });

    // Prepare the content for analysis
    const content = [];

    if (imageBase64) {
      // Extract the base64 data and mime type from data URL
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];

        content.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      }
    }

    content.push({ text: prompt });

    const response = await model.generateContent(content);
    const result = response.response.text();
    if (!result) {
      throw new Error("Empty response from Gemini");
    }

    const analysis: AIAnalysis = JSON.parse(result);

    // Validate the response
    if (
      !analysis.domain ||
      !analysis.category ||
      !analysis.urgency ||
      !analysis.priority ||
      !analysis.severity ||
      typeof analysis.confidence !== "number" ||
      !analysis.reasoning
    ) {
      throw new Error("Invalid analysis format");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini analysis failed:", error);

    // Fallback analysis based on keywords
    return fallbackAnalysis(description);
  }
}

function fallbackAnalysis(description: string): AIAnalysis {
  const text = description.toLowerCase();

  // Emergency keywords
  const emergencyKeywords = [
    "leak",
    "flood",
    "fire",
    "exposed",
    "emergency",
    "urgent",
    "danger",
    "broken",
    "burst",
  ];
  const isEmergency = emergencyKeywords.some((keyword) =>
    text.includes(keyword)
  );

  // Domain and category detection
  let domain = "General Maintenance";
  let category = "General Issue";

  if (
    text.includes("water") ||
    text.includes("leak") ||
    text.includes("pipe") ||
    text.includes("plumb")
  ) {
    domain = "Plumbing";
    category = "Water System Issue";
  } else if (
    text.includes("light") ||
    text.includes("electric") ||
    text.includes("power") ||
    text.includes("outlet")
  ) {
    domain = "Electrical";
    category = "Electrical System Issue";
  } else if (
    text.includes("heat") ||
    text.includes("cool") ||
    text.includes("hvac") ||
    text.includes("air")
  ) {
    domain = "HVAC";
    category = "Climate Control Issue";
  } else if (
    text.includes("paint") ||
    text.includes("cosmetic") ||
    text.includes("appearance")
  ) {
    domain = "General Maintenance";
    category = "Cosmetic Issue";
  } else if (
    text.includes("structure") ||
    text.includes("crack") ||
    text.includes("foundation")
  ) {
    domain = "Structural";
    category = "Structural Issue";
  }

  // Urgency, priority, and severity detection
  let urgency = "STANDARD";
  let priority = "MEDIUM";
  let severity = "MEDIUM";
  let riskLevel = "MEDIUM";
  let estimatedCost = "$100-500";
  let timeToResolve = "1-2 days";

  if (isEmergency || text.includes("urgent") || text.includes("immediate")) {
    urgency = "URGENT";
    priority = "HIGH";
    severity = "HIGH";
    riskLevel = "HIGH";
    estimatedCost = "$500-2000";
    timeToResolve = "2-8 hours";
  } else if (
    text.includes("minor") ||
    text.includes("cosmetic") ||
    text.includes("routine")
  ) {
    urgency = "ROUTINE";
    priority = "LOW";
    severity = "LOW";
    riskLevel = "LOW";
    estimatedCost = "$50-200";
    timeToResolve = "1-2 weeks";
  }

  return {
    domain,
    category,
    urgency,
    priority,
    severity,
    confidence: 0.6,
    reasoning:
      "Fallback analysis due to AI service unavailability. Manual review recommended for accurate assessment.",
    estimatedCost,
    timeToResolve,
    riskLevel,
  };
}
