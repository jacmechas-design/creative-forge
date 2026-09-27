import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

type ImageEventPayload =
  | { type: "image_generation.partial_image"; b64_json: string; partial_image_index: number }
  | { type: "image_generation.completed"; b64_json: string }
  | { type: "error"; error: { message: string } };

/** Streams AI image frames from a backend route; each frame is a full PNG data URL. */
export async function streamImage(
  endpoint: string,
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Image generation failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  let sawCompleted = false;
  let sawAnyEvent = false;
  let streamError: string | undefined;

  const parser = createParser({
    onEvent(event) {
      let payload: ImageEventPayload | undefined;
      try {
        payload = JSON.parse(event.data) as ImageEventPayload;
      } catch {
        /* keep generic message */
      }
      if (event.event === "error" || payload?.type === "error") {
        sawAnyEvent = true;
        streamError =
          (payload as { error?: { message?: string } } | undefined)?.error?.message ??
          "Image generation failed";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed" &&
        event.event !== "image_edit.partial_image" &&
        event.event !== "image_edit.completed"
      )
        return;
      if (!payload) return;
      sawAnyEvent = true;
      const isFinal =
        event.event === "image_generation.completed" || event.event === "image_edit.completed";
      flushSync(() => {
        onFrame(`data:image/png;base64,${(payload as { b64_json: string }).b64_json}`, isFinal);
      });
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    void reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAnyEvent) {
    // Transport hiccup: replay once, non-streamed.
    const replay = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: false }),
      ...(signal ? { signal } : {}),
    });
    if (!replay.ok) {
      throw new Error(`Image generation failed: ${replay.status}`);
    }
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }
  if (!sawCompleted) throw new Error("Image stream ended without a completed event");
}
