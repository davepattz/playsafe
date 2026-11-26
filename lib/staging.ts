export function isStagingBuild(env: NodeJS.ProcessEnv = process.env) {
  return env.PLAYSAFE_STAGING === "1" || env.CONTEXT === "branch-deploy" || env.CONTEXT === "deploy-preview";
}
