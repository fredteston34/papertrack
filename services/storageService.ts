import { PaperRoll, StockStatus } from '../types';

const STORAGE_KEY = 'paper_track_inventory_v1';

export const getInventory = (): PaperRoll[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading storage", e);
    return [];
  }
};

export const saveRoll = (roll: PaperRoll): boolean => {
  const current = getInventory();
  // Check for duplicate roll number if status is IN_STOCK
  const exists = current.find(r => r.rollNumber === roll.rollNumber && r.status === StockStatus.IN_STOCK);
  if (exists) {
    return false; // Roll already in stock
  }
  const updated = [roll, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return true;
};

export const updateRollStatus = (rollNumber: string, status: StockStatus): PaperRoll | null => {
  const current = getInventory();
  const rollIndex = current.findIndex(r => r.rollNumber === rollNumber && r.status === StockStatus.IN_STOCK);
  
  if (rollIndex === -1) return null;

  const updatedRoll = {
    ...current[rollIndex],
    status,
    dateOut: status === StockStatus.SHIPPED ? new Date().toISOString() : undefined
  };

  current[rollIndex] = updatedRoll;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return updatedRoll;
};

export const deleteRoll = (id: string) => {
    const current = getInventory();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}