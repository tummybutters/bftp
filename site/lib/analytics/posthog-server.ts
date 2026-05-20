import { PostHog } from "posthog-node";

type ServerEventProperties = Record<string, string | number | boolean | null | undefined>;

interface CaptureServerEventInput {
  distinctId: string;
  event: string;
  properties?: ServerEventProperties;
}

function getPostHogConfig() {
  const token = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    "https://us.i.posthog.com";

  return token ? { token, host } : null;
}

function withoutUndefined(properties: ServerEventProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter((entry) => entry[1] !== undefined),
  );
}

export async function captureServerEvent({
  distinctId,
  event,
  properties = {},
}: CaptureServerEventInput) {
  const config = getPostHogConfig();

  if (!config) {
    return;
  }

  const client = new PostHog(config.token, {
    host: config.host,
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId,
      event,
      properties: withoutUndefined(properties),
    });
  } catch (error) {
    console.error("PostHog server event capture failed.", { event, error });
  } finally {
    try {
      await client.shutdown();
    } catch (error) {
      console.error("PostHog server event shutdown failed.", { event, error });
    }
  }
}
