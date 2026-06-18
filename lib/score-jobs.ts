import type { ScoreJobState } from "./types";

export function preferTerminalJobState(
  localState: ScoreJobState | null,
  durableState: ScoreJobState | null,
): ScoreJobState | null {
  if (localState?.status === "complete" || localState?.status === "error") {
    return localState;
  }
  if (durableState?.status === "complete" || durableState?.status === "error") {
    return durableState;
  }
  return localState ?? durableState;
}
