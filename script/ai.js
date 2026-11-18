
const API_URL = "https://api.anthropic.com/v1/messages";

async function askClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 512,
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
    throw new Error(
      data.error?.message || "Claude API request failed"
    );
  }

  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function main() {
  const prompt =
    process.argv.slice(2).join(" ") ||
    "Explain what a Jenkins CI/CD pipeline does in two sentences.";

  console.log("\nSending request to Claude...\n");

  const answer = await askClaude(prompt);

  console.log("Claude's response:\n");
  console.log(answer);
}

main().catch((error) => {
  console.error("AI Error:", error.message);
  process.exitCode = 1;
});
