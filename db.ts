import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

export function readTable<T>(tableName: string): T[] {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function writeTable<T>(tableName: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function findOne<T>(tableName: string, predicate: (item: T) => boolean): T | undefined {
  const table = readTable<T>(tableName);
  return table.find(predicate);
}

export function insert<T>(tableName: string, item: T): T {
  const table = readTable<T>(tableName);
  table.push(item);
  writeTable(tableName, table);
  return item;
}

export function update<T>(tableName: string, predicate: (item: T) => boolean, updates: Partial<T>): T | undefined {
  const table = readTable<T>(tableName);
  const index = table.findIndex(predicate);
  if (index === -1) return undefined;
  table[index] = { ...table[index], ...updates };
  writeTable(tableName, table);
  return table[index];
}
