import * as amplitude from "@amplitude/analytics-browser";

type EventProperties = Record<string, unknown>;

type InitOptions = {
  country?: string | null;
  language: string;
};

let initPromise: Promise<void> | null = null;
let isInitialized = false;
let isSessionReplayLoading = false;
let sessionReplayTimer: number | null = null;

function hasAmplitudeKey() {
  return Boolean(import.meta.env.VITE_AMPLITUDE_API_KEY);
}

async function loadSessionReplayPlugin() {
  if (isSessionReplayLoading) {
    return;
  }

  isSessionReplayLoading = true;

  try {
    const sessionReplay = await import("@amplitude/plugin-session-replay-browser");
    const sessionReplayPlugin = sessionReplay.plugin({
      sampleRate: 0.3,
    });

    await amplitude.add(sessionReplayPlugin).promise;
  } catch (error) {
    console.error("Amplitude Session Replay init failed", error);
  }
}

export async function initAmplitude(options: InitOptions) {
  if (!hasAmplitudeKey()) {
    return;
  }

  if (!initPromise) {
    initPromise = amplitude
      .init(import.meta.env.VITE_AMPLITUDE_API_KEY as string, undefined, {
        defaultTracking: false,
      })
      .promise.then(() => {
        isInitialized = true;

        if (sessionReplayTimer === null) {
          sessionReplayTimer = window.setTimeout(() => {
            void loadSessionReplayPlugin();
          }, 5000);
        }
      });
  }

  await initPromise;

  const identify = new amplitude.Identify().set("language", options.language);

  if (options.country) {
    identify.set("country", options.country);
  }

  amplitude.identify(identify);
}

export async function track(event: string, properties?: EventProperties) {
  if (!hasAmplitudeKey()) {
    return;
  }

  if (!initPromise) {
    await initAmplitude({
      language: "ru",
    });
  } else if (!isInitialized) {
    await initPromise;
  }

  amplitude.track(event, properties);
}
