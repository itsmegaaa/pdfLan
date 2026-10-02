import { TOOLS } from '../constants/tools';
import { matchesAccept } from './fileHelpers';

/**
 * Tool apa aja yang cocok untuk file-file ini (buat smart drop di Home).
 * - File >1 → hanya tool yang support multiple/batch
 * - Semua file harus cocok dengan accept tool tersebut
 */
export function toolsForFiles(files) {
  if (!files?.length) return [];
  const multi = files.length > 1;
  return TOOLS.filter((t) => {
    if (!t.accept) return false;
    if (t.maintenance) return false;
    if (multi && !(t.multiple || t.batch)) return false;
    return files.every((f) => matchesAccept(f, t.accept));
  });
}
