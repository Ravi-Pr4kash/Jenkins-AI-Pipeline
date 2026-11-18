
const fs = require("fs");

const API_URL = "https://api.anthropic.com/v1/messages";

async function analyzeFailure() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const logFile = process.argv[2];

    // 1. Validate API key
    if (!apiKey) {
        throw new Error("Claude API key is missing");
    }

    // 2. Validate log file
    if (!logFile || !fs.existsSync(logFile)) {
        throw new Error("Failure log file not found");
    }

    // 3. Read Jenkins logs
    const logs = fs.readFileSync(logFile, "utf8");

    if (!logs.trim()) {
        throw new Error("Jenkins failure log is empty");
    }

    // Limit logs to reduce API usage
    const limitedLogs = logs.slice(-12000);

    // 4. Prepare prompt
    const prompt = `
You are an experienced DevOps engineer.

Analyze the following Jenkins pipeline failure.

Explain:

1. What went wrong?
2. What is the root cause?
3. How can we fix it?
4. What exact command or code change is required?

Keep the explanation simple, practical, and beginner-friendly.

JENKINS FAILURE LOGS:

${limitedLogs}
`;

    console.log("Sending failure logs to Claude...");

    // 5. Call Claude API
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

    // 6. Parse API response
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Claude API Error (${response.status}): ${JSON.stringify(data)}`
        );
    }

    // 7. Debug: print complete API response
    console.log("\n========== CLAUDE RAW RESPONSE ==========\n");

    console.log(JSON.stringify(data, null, 2));

    // 8. Extract diagnosis text
    const diagnosis = (data.content || [])
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");

    if (!diagnosis.trim()) {
        throw new Error("Claude returned no text diagnosis");
    }

    // 9. Display AI diagnosis
    console.log("\n========== CLAUDE AI DIAGNOSIS ==========\n");

    console.log(diagnosis);

    console.log("\n=========================================");
}

// Execute
analyzeFailure().catch((error) => {
    console.error("\nAI analysis failed:", error.message);
    process.exitCode = 1;
});
