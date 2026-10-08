export async function verifyAppLock(): Promise<boolean> {
  const enabled = localStorage.getItem('meu-dindin-applock') === 'true'
  const credIdB64 = localStorage.getItem('meu-dindin-applock-id')
  if (!enabled || !credIdB64) return true // não bloqueia

  if (!window.PublicKeyCredential) return true

  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)

  // decode base64 → ArrayBuffer do rawId
  const id = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0))

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id, type: 'public-key', transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return Boolean(assertion)
  } catch {
    return false
  }
}
