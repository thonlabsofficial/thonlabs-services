import { logger, task, wait } from "@trigger.dev/sdk";

export const customDomainsGenerateSshKeyTask = task({
  id: "custom-domains-generate-ssh-key",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: any, { ctx }) => {
    logger.log("Generating SSH key for custom domains", { payload, ctx });

    await wait.for({ seconds: 5 });

    return {
      message: "Hello, world!",
    }
  },
});