
const fs = require("fs");

const API_URL = "https://api.anthropic.com/v1/messages";

async function analyzeFailure() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const logFile = process.argv[2];

  if (!apiKey) {
    throw new Error("Claude API key is missing");
  }

  if (!logFile || !fs.existsSync(logFile)) {
    throw new Error("Failure log file not found");
  }

  const logs = fs.readFileSync(logFile, "utf8");

  // Avoid sending excessively large logs
  const limitedLogs = logs.slice(-12000);

  const prompt = `
You are an experienced DevOps engineer.

Analyze the following Jenkins pipeline failure.

Explain:
1. What went wrong?
2. What is the root cause?
3. How can we fix it?
4. What command or code change is required?

Keep the explanation simple and practical.

JENKINS FAILURE LOGS:
${limitedLogs}
`;

  console.log("Sending failure logs to Claude...");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  console.log("\n========== CLAUDE AI DIAGNOSIS ==========\n");

  console.log(
    data.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
  );

  console.log("\n=========================================");
}

analyzeFailure().catch((error) => {
  console.error("AI analysis failed:", error.message);
  process.exitCode = 1;
});
