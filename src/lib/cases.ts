import fs from 'fs/promises';
import path from 'path';
import { Case } from '@/lib/data';

const CASES_DIR = path.join(process.cwd(), 'public', 'data', 'cases');

// Scan all cases in the public/data/cases directory
// It might be organized by category folders: public/data/cases/{category}/{caseId}.json
export async function getAllCases(): Promise<Case[]> {
    const cases: Case[] = [];
    
    async function scanDir(dir: string) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await scanDir(fullPath);
                } else if (entry.name.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const data = JSON.parse(content);
                        if (data.id && data.trueDiagnosis) {
                           cases.push(data);
                        }
                    } catch (e) {
                         // ignore malformed
                    }
                }
            }
        } catch (e) {
            // dir might not exist
        }
    }

    await scanDir(CASES_DIR);
    return cases;
}

// Scan deeply for cases matching the category
export async function getCasesByCategory(categoryId: string): Promise<Case[]> {
    const allCases = await getAllCases();
    return allCases.filter(c => c.categoryId === categoryId);
}

export async function getRandomCase(categoryId: string): Promise<Case | null> {
    const cases = await getCasesByCategory(categoryId);
    if (cases.length === 0) return null;
    return cases[Math.floor(Math.random() * cases.length)];
}

// Fallback to static data if no local files found (optional, for backward compatibility)
import { MOCK_CASES } from '@/lib/data';

export async function getCaseById(caseId: string): Promise<Case | null> {
    // First try to find in all scanned files
    // This is inefficient if we have thousands of files, but for now it's fine.
    // A better way is to know the category or have an index.
    // Since we don't know the category easily from ID unless we parse it or scan everything,
    // let's scan everything.
    const all = await getAllCases();
    const found = all.find(c => c.id === caseId);
    if (found) return found;

    // Fallback to MOCK
    return MOCK_CASES.find(c => c.id === caseId) || null;
}
