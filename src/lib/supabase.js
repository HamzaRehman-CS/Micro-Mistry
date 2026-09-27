import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://suqbfqjbdncwneuvoppr.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cWJmcWpiZG5jd25ldXZvcHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODE1NjUsImV4cCI6MjEwNjA1NzU2NX0.pp4sE4rRTGz8cchPmKvsOYAErEtfv0SzYGlnNP58Xz8';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Saves a completed Micro Mystery attempt to Supabase (and local /api/save if running locally).
 */
export async function saveAttemptRecord({ attemptId, name, universityId, number, score, correct, wrong, attempted }) {
  const result = { savedToSupabase: false, savedToLocal: false, error: null };

  // 1. Save to Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from('micro_mystery_attempts').insert([
        {
          id: attemptId,
          name: name.trim(),
          university_id: universityId.trim(),
          phone: number.trim(),
          score: Number(score) || 0,
          correct: Number(correct) || 0,
          wrong: Number(wrong) || 0,
          attempted: Number(attempted) || 5,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        console.warn('Supabase save error:', error.message);
        result.error = error.message;
      } else {
        result.savedToSupabase = true;
      }
    } catch (err) {
      console.warn('Failed to reach Supabase:', err);
      result.error = err.message;
    }
  }

  // 2. Also attempt local Vite backend /api/save if available (for desktop Excel update)
  try {
    const localRes = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, name, universityId, number, score, correct, wrong, attempted })
    });
    if (localRes.ok) {
      result.savedToLocal = true;
    }
  } catch {
    // Expected on Vercel / static hosting
  }

  if (result.savedToSupabase || result.savedToLocal) {
    return { ok: true, ...result };
  }

  throw new Error(result.error || 'Failed to record attempt to database.');
}

/**
 * Helper to fetch system markers with highest reliability.
 * Calculates the absolute maximum (latest) cleared timestamp and set of deleted IDs.
 */
async function getSystemState(tableName) {
  if (!supabase) return { deletedIds: new Set(), clearedTime: 0 };

  try {
    const { data } = await supabase
      .from(tableName)
      .select('name, university_id, created_at')
      .like('name', '__%')
      .order('created_at', { ascending: false });

    const systemRows = Array.isArray(data) ? data : [];

    const deletedIds = new Set(
      systemRows
        .filter(r => r.name === '__DELETED_ATTEMPT__')
        .map(r => (r.university_id || '').toLowerCase().trim())
        .filter(Boolean)
    );

    const clearRows = systemRows.filter(r => r.name === '__LEADERBOARD_CLEARED__');
    const clearTimes = clearRows.map(r => new Date(r.created_at).getTime()).filter(t => !isNaN(t));
    const clearedTime = clearTimes.length > 0 ? Math.max(...clearTimes) : 0;

    return { deletedIds, clearedTime };
  } catch (err) {
    console.warn(`[${tableName}] Failed to fetch system metadata:`, err);
    return { deletedIds: new Set(), clearedTime: 0 };
  }
}

/**
 * Fetches Micro Mystery leaderboard entries.
 * Guaranteed no repetitions (each participant appears once with their best score).
 * Guaranteed synchronized with clear and delete actions.
 */
export async function fetchLeaderboardEntries() {
  if (supabase) {
    try {
      const { deletedIds, clearedTime } = await getSystemState('micro_mystery_attempts');

      const { data, error } = await supabase
        .from('micro_mystery_attempts')
        .select('id, name, university_id, score, correct, wrong, attempted, created_at')
        .order('score', { ascending: false })
        .order('correct', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(500);

      if (!error && Array.isArray(data)) {
        const activeRows = data.filter(row => {
          if (!row.name || row.name.startsWith('__')) return false;
          const uId = (row.university_id || '').toLowerCase().trim();
          const pName = (row.name || '').toLowerCase().trim();
          if (deletedIds.has(uId) || deletedIds.has(pName)) return false;
          const rowTime = new Date(row.created_at).getTime();
          if (clearedTime > 0 && rowTime <= clearedTime) return false;
          return true;
        });

        // Deduplicate by participant (single best attempt)
        const seen = new Set();
        const deduplicated = [];

        for (const row of activeRows) {
          const key = (row.university_id || '').toLowerCase().trim() || (row.name || '').toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            deduplicated.push({
              id: row.id,
              name: row.name,
              universityId: row.university_id,
              score: row.score,
              correct: row.correct,
              wrong: row.wrong,
              attempted: row.attempted,
              timestamp: row.created_at
            });
          }
        }

        return {
          entries: deduplicated
        };
      }
    } catch (err) {
      console.warn('Supabase leaderboard fetch fallback:', err);
    }
  }

  // Fallback to local /api/leaderboard if available
  const response = await fetch('/api/leaderboard', { cache: 'no-store' });
  if (!response.ok) throw new Error('Leaderboard is currently unavailable.');
  const json = await response.json();
  return {
    entries: json.entries || []
  };
}

/**
 * Searches attempts by University ID or Name (for admin deletion).
 */
export async function searchAttempts(searchTerm) {
  if (!supabase) return [];
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  try {
    const { deletedIds, clearedTime } = await getSystemState('micro_mystery_attempts');

    const { data } = await supabase
      .from('micro_mystery_attempts')
      .select('id, name, university_id, phone, score, correct, wrong, attempted, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (!Array.isArray(data)) return [];

    return data
      .filter(row => {
        if (!row.name || row.name.startsWith('__')) return false;
        const uId = (row.university_id || '').toLowerCase().trim();
        const pName = (row.name || '').toLowerCase().trim();
        const matches = uId.includes(term) || pName.includes(term);
        if (!matches) return false;
        if (deletedIds.has(uId) || deletedIds.has(pName)) return false;
        return true;
      })
      .map(row => {
        const rowTime = new Date(row.created_at).getTime();
        const isPriorToClear = clearedTime > 0 && rowTime <= clearedTime;
        return {
          ...row,
          statusLabel: isPriorToClear ? 'Cleared (Archived)' : 'Active Contender'
        };
      });
  } catch (err) {
    console.warn('Error searching attempts:', err);
    return [];
  }
}

/**
 * Deletes an attempt by University ID.
 */
export async function deleteAttemptByUniversityId(universityId) {
  if (!supabase) return;
  const cleanId = universityId.trim();
  if (!cleanId) throw new Error('University ID is required.');

  try {
    await supabase
      .from('micro_mystery_attempts')
      .delete()
      .ilike('university_id', cleanId);
  } catch {
    // handled by tombstone
  }

  // Insert tombstone
  const { error } = await supabase.from('micro_mystery_attempts').insert([
    {
      id: crypto.randomUUID(),
      name: '__DELETED_ATTEMPT__',
      university_id: cleanId,
      phone: 'SYSTEM',
      score: -999999,
      correct: 0,
      wrong: 0,
      attempted: 0,
      created_at: new Date().toISOString()
    }
  ]);

  if (error) throw new Error('Failed to delete attempt: ' + error.message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('leaderboard-updated'));
  }
}

/**
 * Clears the entire leaderboard (resets all participant attempts).
 */
export async function clearAllLeaderboardAttempts() {
  if (!supabase) return;

  try {
    await supabase
      .from('micro_mystery_attempts')
      .delete()
      .not('name', 'like', '__%');
  } catch {
    // handled by tombstone
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from('micro_mystery_attempts').insert([
    {
      id: crypto.randomUUID(),
      name: '__LEADERBOARD_CLEARED__',
      university_id: 'SYSTEM',
      phone: 'SYSTEM',
      score: -999999,
      correct: 0,
      wrong: 0,
      attempted: 0,
      created_at: nowIso
    }
  ]);

  if (error) throw new Error('Failed to clear leaderboard: ' + error.message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('leaderboard-updated'));
  }
}

/**
 * Downloads a complete CSV of all participant records (Admin only).
 * Includes Name, University ID, Phone, Score, and Timestamps.
 */
export async function downloadAttemptsCsv() {
  let records = [];

  if (supabase) {
    const { deletedIds, clearedTime } = await getSystemState('micro_mystery_attempts');

    const { data, error } = await supabase
      .from('micro_mystery_attempts')
      .select('*')
      .not('name', 'like', '__%')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);

    records = (data || []).filter(row => {
      const uId = (row.university_id || '').toLowerCase().trim();
      const pName = (row.name || '').toLowerCase().trim();
      if (deletedIds.has(uId) || deletedIds.has(pName)) return false;
      const rowTime = new Date(row.created_at).getTime();
      if (clearedTime > 0 && rowTime <= clearedTime) return false;
      return true;
    });
  } else {
    const response = await fetch('/api/leaderboard', { cache: 'no-store' });
    const json = await response.json();
    records = json.entries || [];
  }

  if (records.length === 0) {
    alert('No participant records to export yet.');
    return;
  }

  const headers = ['Attempt ID', 'Participant Name', 'University ID', 'Phone Number', 'Score', 'Correct', 'Wrong', 'Attempted', 'Date/Time'];
  const csvRows = [headers.join(',')];

  for (const item of records) {
    const escapeCsv = (val) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const row = [
      escapeCsv(item.id || item.attemptId),
      escapeCsv(item.name),
      escapeCsv(item.university_id || item.universityId),
      escapeCsv(item.phone || item.number || 'N/A'),
      item.score ?? 0,
      item.correct ?? 0,
      item.wrong ?? 0,
      item.attempted ?? 5,
      escapeCsv(item.created_at || item.completedAt || item.timestamp || '')
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Science_Festa_Micro_Mystery_Attempts_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
