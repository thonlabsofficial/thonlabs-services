export default function getEnvIdHash(envId: string) {
  return envId.split('-').reverse()[0];
}
