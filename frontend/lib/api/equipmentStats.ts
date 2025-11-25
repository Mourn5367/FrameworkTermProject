/**
 * 장비 통계 API 호출 함수
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ItemStat {
  itemId: string;
  itemName: string;
  count: number;
  percentage: number;
}

export interface SkillStat {
  skillId: string;
  skillName: string;
  count: number;
  percentage: number;
  type1Count: number;
  type2Count: number;
  type1Percentage: number;
  type2Percentage: number;
  type1Name: string;
  type2Name: string;
}


export interface CombinationStat {
  combination: string;
  count: number;
  percentage: number;
  tags?: string[];
}

export interface JobEquipmentStats {
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  totalCharacters: number;

  // 무기
  weaponTypes: ItemStat[];
  weaponTunes: ItemStat[];

  // 칭호
  titles: ItemStat[];

  // 방어구 융합석 (5개)
  jacketUpgrades: ItemStat[];
  headShoulderUpgrades: ItemStat[];
  pantsUpgrades: ItemStat[];
  shoesUpgrades: ItemStat[];
  beltUpgrades: ItemStat[];
  armorSetCombinations: CombinationStat[];

  // 악세서리 융합석 (3개)
  necklaceUpgrades: ItemStat[];
  braceletUpgrades: ItemStat[];
  ringUpgrades: ItemStat[];
  accessoryCombinations: CombinationStat[];

  // 특수장비 융합석 (3개)
  subEquipmentUpgrades: ItemStat[];
  magicStoneUpgrades: ItemStat[];
  earringUpgrades: ItemStat[];
  specialEquipmentCombinations: CombinationStat[];

  // 세트 아이템 및 스킬
  setItems: ItemStat[];
  evolutionSkills: SkillStat[];
  enhancementSkills: SkillStat[];
  skillCombinations: CombinationStat[];
}

/**
 * 직업별 장비 통계 조회
 * @param jobId - 직업 ID (예: "b9cb48777665de22c006fabaf9a560b3")
 * @param jobGrowId - 각성 직업 ID (예: "48dd161661a91934cdc6d78e9d11a70d")
 */
export async function getEquipmentStats(
  jobId: string,
  jobGrowId: string
): Promise<JobEquipmentStats> {
  const url = `${API_BASE_URL}/api/stats/equipment?jobId=${jobId}&jobGrowId=${jobGrowId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // 항상 최신 데이터 가져오기
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch equipment stats: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
