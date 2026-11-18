
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

    if (!logs.trim()) {
        throw new Error("Jenkins failure log is empty");
    }

    const limitedLogs = logs.slice(-12000);

    const prompt = `
You are an experienced DevOps engineer analyzing Jenkins pipeline logs.

Analyze the actual failure shown in these logs.

Important rules:
- Identify the exact stage and command that failed.
- Do not assume a warning is the root cause.
- If you see "SIMULATED ERROR", recognize that it was deliberately injected for testing.
- Do not claim that a simulated error proves a real database failure.
- Distinguish actual errors from warnings.

Explain:

1. What went wrong?
2. Which pipeline stage failed?
3. What is the root cause?
4. How can we fix it?
5. Give the exact command or code change if applicable.

Keep your answer beginner-friendly and concise.
Limit your response to approximately 250 words.

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

            // Allow enough room for the diagnosis
            max_tokens: 2000,

            // Disable extended thinking for this simple task
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
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Claude API Error (${response.status}): ${JSON.stringify(data)}`
        );
    }

    console.log("\n========== CLAUDE AI DIAGNOSIS ==========\n");

    const diagnosis = (data.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

    if (!diagnosis.trim()) {
        console.error("Claude returned no text.");
        console.error("Stop reason:", data.stop_reason);
        console.error("Usage:", JSON.stringify(data.usage));
        throw new Error("Claude returned an empty diagnosis");
    }

    console.log(diagnosis);

    console.log("\n=========================================");

    console.log("Claude stop reason:", data.stop_reason);
}

analyzeFailure().catch(error => {
    console.error("\nAI analysis failed:", error.message);
    process.exitCode = 1;
});
