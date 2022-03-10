const redirectUri = `http://localhost:${process.env.PORT}`

function getUrl(hostname: string, base = ""): string {
  return hostname === "localhost" ? redirectUri + base : "https://" + hostname + base
}

let accountsStore: Record<string, string> = {}
let cursorsStore: Record<string, string> = {}

export { getUrl, accountsStore, cursorsStore }
