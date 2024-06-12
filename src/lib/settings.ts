type UserSettings = {
  walletName: string,
  publicKey: string,
  networkName: string,
  additionalArgs: string
}

export type Settings = {
  user: UserSettings
}

const DEFAULT: Settings = {
  user: {
    walletName: 'WALLET_NAME',
    publicKey: 'PUBLIC_KEY',
    networkName: 'mainnet1',
    additionalArgs: ''
  }
}

const LOCAL_STORAGE_KEY = 'settings'

export function save(settings: Settings): Settings {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
  return settings
}

export function load(): Settings {
  const value = localStorage.getItem(LOCAL_STORAGE_KEY)

  // Deliberate loose equality
  if (!value) return DEFAULT

  const settings = JSON.parse(value)

  // migration from user only settings
  if (settings.user == null) return { user: settings }

  return settings
}
