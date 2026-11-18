
const fs = require("fs");

const API_URL = "https://api.anthropic.com/v1/messages";

async function analyzeFailure() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const logFile = process.argv[2];

    // Validate API key
    if (!apiKey) {
        throw new Error("Claude API key is missing");
    }

    // Validate log file
    if (!logFile || !fs.existsSync(logFile)) {
        throw new Error("Failure log file not found");
    }

    // Read Jenkins logs
    const logs = fs.readFileSync(logFile, "utf8");

    if (!logs.trim()) {
        throw new Error("Jenkins failure log is empty");
    }

    // Limit input to control API usage
    const limitedLogs = logs.slice(-12000);

    const prompt = `
You are an experienced DevOps engineer.

Analyze this Jenkins pipeline failure.

Explain:

1. What went wrong?
2. Which pipeline stage failed?
3. What is the root cause?
4. How can we fix it?
5. What exact command or code change is required?

Important:
- Distinguish warnings from actual failures.
- Identify simulated errors as simulated.
- Never invent a root cause that the logs do not support.
- If the logs are insufficient, explain what additional information is needed.

Keep the answer beginner-friendly and concise.
Limit your response to approximately 250 words.

JENKINS FAILURE LOGS:

${limitedLogs}
`;

    console.log("Sending failure logs to Claude...");

    // Call Claude API
    const response = await fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2026-10-21"
        },

        body: JSON.stringify({
            model: "claude-haiku-5-5",

            max_tokens: 2000,

            thinking: {
                type: "disabled"
            },

            output_config: {
                effort: "low"
            },

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        }),

        signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Claude API Error (${response.status}): ${JSON.stringify(data)}`
        );
    }

    // Extract text response
    const diagnosis = (data.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

    if (!diagnosis.trim()) {
        throw new Error(
            `Claude returned no diagnosis. Stop reason: ${data.stop_reason}`
        );
    }

    console.log("\n========== CLAUDE AI DIAGNOSIS ==========\n");

    console.log(diagnosis);

    console.log("\n=========================================");

    if (data.stop_reason === "max_tokens") {
        console.warn("Warning: Claude's response may be incomplete.");
    }

    console.log("Claude stop reason:", data.stop_reason);
}

// Execute diagnosis
analyzeFailure().catch(error => {
    console.error("\nAI analysis failed:", error.message);
    process.exitCode = 1;
});
