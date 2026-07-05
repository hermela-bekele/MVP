import type { TrainingMaterial } from '@/lib/mockData';

/** Disseminated department / curriculum resources are visible to every teacher. */
export function isTrainingMaterialVisibleToTeacher(material: TrainingMaterial): boolean {
  return Boolean(material.disseminated);
}

export function filterTrainingMaterialsForTeacher(
  materials: TrainingMaterial[],
): TrainingMaterial[] {
  return materials.filter(isTrainingMaterialVisibleToTeacher);
}
