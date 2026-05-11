export interface ProfileSettings {
  name: string;
  email: string;
}

export interface BrokerSettings {
  broker: string;
  alias: string;
  baseCurrency: string;
}

export interface ServiceStatus {
  label: string;
  description: string;
  connected: boolean;
}

