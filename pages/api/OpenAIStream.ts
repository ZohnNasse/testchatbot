import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

export interface OpenAIStreamPayload {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
}

export interface OpenAIStreamPayload {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
}

export async function OpenAIStream(payload: OpenAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();


  console.log("Sending request to OpenAI API with payload:", payload);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Received response from OpenAI API:", res);

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          console.log("Received event data:", data);
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            console.log("Parsed JSON from event data:", json);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            // maybe parse error
            console.error("Error parsing event data:", e);
            controller.error(e);
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}
