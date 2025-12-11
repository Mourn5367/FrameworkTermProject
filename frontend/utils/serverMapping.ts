/**
 * 던파 서버 ID와 한글 이름 매핑
 */

export const SERVER_MAP: { [key: string]: string } = {
  '카인': 'cain',
  '디레지에': 'diregie',
  '시로코': 'siroco',
  '프레이': 'prey',
  '카시야스': 'casillas',
  '힐더': 'hilder',
  '안톤': 'anton',
  '바칼': 'bakal'
};

// 역방향 매핑 (영어 -> 한글)
export const SERVER_MAP_REVERSE: { [key: string]: string } = {
  'cain': '카인',
  'diregie': '디레지에',
  'siroco': '시로코',
  'prey': '프레이',
  'casillas': '카시야스',
  'hilder': '힐더',
  'anton': '안톤',
  'bakal': '바칼'
};

/**
 * 한글 서버명을 영문 서버 ID로 변환
 */
export const getServerIdFromKorean = (koreanName: string): string => {
  return SERVER_MAP[koreanName] || koreanName.toLowerCase();
};

/**
 * 영문 서버 ID를 한글 서버명으로 변환
 */
export const getServerNameKorean = (serverId: string): string => {
  return SERVER_MAP_REVERSE[serverId.toLowerCase()] || serverId;
};

/**
 * 서버 목록 (한글)
 */
export const SERVER_LIST_KOREAN = [
  '카인',
  '디레지에',
  '시로코',
  '프레이',
  '카시야스',
  '힐더',
  '안톤',
  '바칼'
];
