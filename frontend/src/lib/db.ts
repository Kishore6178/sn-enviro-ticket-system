import Dexie, { Table } from 'dexie';

export interface OfflineTicket {
  id?: number;
  manualStationName: string;
  contactEmail: string;
  locationDetails: string;
  telemetryIssueType: string;
  subject: string;
  remoteSoftware: string;
  remoteId: string;
  remotePassword?: string;
  description: string;
  timestamp: number;
}

export class SNEnviroDatabase extends Dexie {
  tickets!: Table<OfflineTicket, number>;

  constructor() {
    super('SNEnviroDatabase');
    this.version(1).stores({
      tickets: '++id, timestamp' // Primary key and indexed props
    });
  }
}

export const db = new SNEnviroDatabase();
