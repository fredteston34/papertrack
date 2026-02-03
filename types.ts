export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  SHIPPED = 'SHIPPED'
}

export interface PaperRoll {
  id: string;
  rollNumber: string; // Numéro de bobine (Unique)
  eanProductCode: string; // Code EAN
  details: string; // Détails (Type de papier, grammage, etc.)
  customerOrderNumber: string; // Commande client
  status: StockStatus;
  dateIn: string; // ISO String
  dateOut?: string; // ISO String
}

export interface StockStats {
  totalRolls: number;
  totalInStock: number;
  totalShipped: number;
  recentActivity: PaperRoll[];
}

export type ViewState = 'DASHBOARD' | 'ENTRIES' | 'EXITS' | 'INVENTORY' | 'ASSISTANT';