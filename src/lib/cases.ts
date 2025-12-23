import { supabase } from '@/lib/supabase';
import { Case } from '@/lib/data';
import { MOCK_CASES } from '@/lib/data';

// Helper to map DB row to Case object
// We assume the 'cases' table has a 'content' jsonb column that stores the full Case object
// Or we can construct it if columns are separate. Based on plan, we use 'content' for full object.
function mapRowToCase(row: any): Case {
    if (row.content) {
        // If content is stored as JSON string or object
        const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        return { ...content, id: row.id }; // Ensure ID matches
    }
    return row as Case; // Fallback if columns matched
}

export async function getAllCases(): Promise<Case[]> {
    const { data, error } = await supabase.from('cases').select('*');
    if (error) {
        console.error("Error fetching cases:", error);
        return [];
    }
    return (data || []).map(mapRowToCase);
}

export async function getCasesByCategory(categoryId: string): Promise<Case[]> {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('category_id', categoryId);
    
    if (error) {
        console.error("Error fetching cases by category:", error);
        return [];
    }
    return (data || []).map(mapRowToCase);
}

export async function getRandomCase(categoryId: string): Promise<Case | null> {
    // There is no easy 'random' in supabase simple query without stored procedure
    // So we fetch all (filtered) and pick random
    const cases = await getCasesByCategory(categoryId);
    if (cases.length === 0) return null;
    return cases[Math.floor(Math.random() * cases.length)];
}

export async function getCaseById(caseId: string): Promise<Case | null> {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
    
    if (error) {
        // Fallback to MOCK if not found in DB (dev mode mainly)
        const mock = MOCK_CASES.find(c => c.id === caseId);
        if (mock) return mock;
        return null;
    }
    
    return mapRowToCase(data);
}
