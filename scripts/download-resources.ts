#!/usr/bin/env node
/**
 * WenZi — Download & Process Dictionary Resources
 * ──────────────────────────────────────────────────
 * Tự động tải dữ liệu từ điển từ các nguồn mở và xử lý.
 *
 * Nguồn dữ liệu:
 *   1. CC-CEDICT (Trung-Anh) - https://www.mdbg.net/chinese/dictionary
 *   2. HSK Vocabulary - chuẩn HSK 1-9
 *   3. Dictionary data từ GitHub repos
 *
 * Dùng:
 *   node scripts/download-resources.ts
 *   npx tsx scripts/download-resources.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ── Types ────────────────────────────────────────────────────────────────
interface DictEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  hanviet: string;
  vietnamese: string;
}

interface CEDICTEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
}

// ── Config ───────────────────────────────────────────────────────────────
const OUTPUT_DIR = join(process.cwd(), 'public', 'data', 'chunks');
const RAW_DATA_DIR = join(process.cwd(), 'src', 'data', 'raw');
const SAMPLE_FILE = join(process.cwd(), 'src', 'data', 'sample_dictionary.json');

// ── Hán Việt chuyển âm ─────────────────────────────────────────────────────
const PINYIN_TO_HANVIET: Record<string, string> = {
  // Consonants
  'b': 'b', 'p': 'b/ph', 'm': 'm', 'f': 'ph',
  'd': 'đ', 't': 'đ/th', 'n': 'n', 'l': 'l',
  'g': 'c/k', 'k': 'k', 'h': 'h', 'ng': 'ng', 'w': 'v',
  'j': 'gi', 'q': 'kh', 'x': 't',
  'zh': 'tr', 'ch': 'x', 'sh': 's', 'r': 'nh',
  'z': 't', 'c': 't', 's': 't',
  'y': 'd',
  // Common syllables mapping
  'a': 'a', 'o': 'o', 'e': 'e', 'i': 'i', 'u': 'u', 'ü': 'ư',
  'ai': 'ai', 'ao': 'ao', 'an': 'an', 'ang': 'ang',
  'ou': 'âu', 'ong': 'ông',
  'ei': 'ây', 'en': 'ân', 'eng': 'anh',
  'er': 'nhi',
};

// Simple Han-Viet conversion (based on common patterns)
function convertToHanviet(pinyin: string): string {
  if (!pinyin) return '';
  const plain = pinyin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ǖǘǚǜ]/g, 'u')
    .toLowerCase()
    .trim();

  // Return simplified hanviet approximation
  return plain.split(' ').map(syl => {
    // Common syllable conversions
    const mapping: Record<string, string> = {
      'wo': 'ngã', 'ni': 'nễ', 'ta': 'tha', 'men': 'môn',
      'shi': 'thị', 'bu': 'bất', 'you': 'hữu', 'zai': 'tại',
      'hao': 'hảo', 'da': 'đại', 'xiao': 'tiểu', 'duo': 'đa',
      'shao': 'thiểu', 'lai': 'lai', 'qu': 'khứ', 'shuo': 'thuyết',
      'kan': 'khán', 'chi': 'xực', 'he': 'hát', 'mai': 'mãi',
      'yao': 'yếu', 'xiang': 'tưởng', 'hui': 'hội', 'neng': 'năng',
      'ke': 'khả', 'yi': 'dĩ', 'yi': 'nhất', 'er': 'nhị',
      'san': 'tam', 'si': 'tứ', 'wu': 'ngũ', 'liu': 'lục',
      'qi': 'thất', 'ba': 'bát', 'jiu': 'cửu', 'shi': 'thập',
      'bai': 'bách', 'qian': 'thiên', 'wan': 'vạn',
      'jin': 'kim', 'ming': 'minh', 'zuo': 'tạc', 'tian': 'thiên',
      'shang': 'thượng', 'xia': 'hạ', 'wu': 'ngọ',
      'wan': 'vãn', 'nian': 'niên', 'yue': 'nguyệt', 'ri': 'nhật',
      'xing': 'tinh', 'qi': 'kỳ', 'ren': 'nhân',
      'ba': 'ba', 'ma': 'ma', 'ge': 'ca', 'jie': 'tỷ',
      'di': 'đệ', 'mei': 'muội', 'er': 'nhi', 'zi': 'tử',
      'nv': 'nữ', 'yi': 'y', 'sheng': 'sinh', 'lao': 'lão',
      'shi': 'sư', 'xue': 'học', 'xi': 'tập', 'gong': 'công',
      'zuo': 'tác', 'si': 'ty', 'xiao': 'hiệu', 'tu': 'đồ',
      'shu': 'thư', 'guan': 'quán', 'yuan': 'viện', 'dian': 'điếm',
      'yin': 'ngân', 'hang': 'hàng', 'ji': 'cơ', 'chang': 'trường',
      'huo': 'hỏa', 'che': 'xa', 'zhan': 'trạm', 'di': 'địa',
      'tie': 'thiết', 'qi': 'khí', 'zi': 'tự', 'xing': 'hành',
      'fei': 'phi', 'ji': 'cơ', 'dian': 'điện', 'hua': 'thoại',
      'shou': 'thủ', 'ji': 'cơ', 'nao': 'não', 'wang': 'võng',
      'luo': 'lạc', 'tian': 'thiên', 'qi': 'khí', 'wen': 'ôn',
      'du': 'độ', 'yu': 'vũ', 'xue': 'tuyết', 'feng': 'phong',
      'tai': 'thái', 'yang': 'dương', 'liang': 'lượng', 'mi': 'mễ',
      'fan': 'phạn', 'mian': 'mịch', 'bao': 'bao', 'niu': 'ngưu',
      'nai': 'nãi', 'ka': 'ca', 'fei': 'phi', 'cha': 'trà',
      'ping': 'bình', 'guo': 'quả', 'xiang': 'hương', 'jiao': 'tiêu',
      'yan': 'nhan', 'se': 'sắc', 'hong': 'hồng', 'bai': 'bạch',
      'hei': 'hắc', 'yu': 'ngữ', 'yan': 'ngôn', 'han': 'hán',
      'ying': 'anh', 'nan': 'nam', 'yue': 'việt', 'ben': 'bản',
      'xie': 'tạ', 'dui': 'đối', 'qi': 'khởi', 'mei': 'vô',
      'guan': 'quan', 'xi': 'hệ', 'ming': 'danh', 'guo': 'quốc',
      'jia': 'gia', 'wen': 'văn', 'hua': 'hóa', 'li': 'lịch',
      'shi': 'sử', 'jing': 'kinh', 'ji': 'tế', 'zheng': 'chính',
      'zhi': 'trị', 'ke': 'khoa', 'xue': 'học', 'shu': 'thuật',
      'ji': 'kỹ', 'huan': 'hoàn', 'jing': 'cảnh', 'wen': 'vấn',
      'ti': 'đề', 'fang': 'phương', 'fa': 'pháp', 'jie': 'kết',
      'guo': 'quả', 'yuan': 'nguyên', 'yin': 'nhân', 'bang': 'bang',
      'zhu': 'trợ', 'xi': 'hy', 'wang': 'vọng', 'ji': 'cơ',
      'hui': 'hội', 'jue': 'quyết', 'ding': 'định', 'zhong': 'trọng',
      'yao': 'yếu', 'cheng': 'thành', 'gong': 'công', 'shi': 'thất',
      'bai': 'bại', 'nu': 'nỗ', 'li': 'lực', 'fa': 'phát',
      'zhan': 'triển', 'xing': 'hạnh', 'fu': 'phúc', 'jian': 'kiến',
      'kang': 'khang', 'an': 'an', 'quan': 'toàn', 'wei': 'nguy',
      'xian': 'hiểm', 'piao': 'phiếu', 'liang': 'lượng', 'cong': 'thông',
      'ming': 'minh', 'qu': 'thú', 'gao': 'cao', 'xing': 'hứng',
      'nan': 'nan', 'guo': 'quá', 'pa': 'phạ', 'si': 'tư',
      'nian': 'niệm', 'chu': 'xuất', 'fa': 'phát', 'lv': 'lữ',
      'xing': 'hành', 'feng': 'phong', 'jing': 'cảnh', 'zhong': 'trung',
      'guo': 'quốc', 'wen': 'văn', 'jian': 'gian', 'ting': 'đình',
      'ai': 'ái', 'qing': 'tình', 'shu': 'thư', 'shui': 'thủy',
      'huo': 'hỏa', 'kong': 'không', 'shan': 'sơn', 'he': 'hà',
      'hai': 'hải', 'hua': 'hoa', 'shu': 'thụ', 'dong': 'động',
      'wu': 'vật', 'mao': 'mao', 'gou': 'cẩu', 'yu': 'ngư',
      'niao': 'điểu', 'ma': 'mã', 'niu': 'ngưu', 'yang': 'dương',
      'zhu': 'trư', 'ji': 'kê', 'ya': 'áp', 'dan': 'đản',
      'rou': 'nhục', 'cai': 'thài', 'guo': 'quả', 'shu': 'thư',
      'cai': 'thái', 'jiao': 'giảo', 'bao': 'bao', 'tang': 'thang',
      'tang': 'đường', 'yan': 'diêm', 'you': 'dầu', 'jiu': 'tửu',
      'qian': 'tiền', 'yuan': 'nguyên', 'kuai': 'khối', 'pian': 'tiện',
      'yi': 'nghi', 'gui': 'quý', 'kuai': 'khoái', 'man': 'mạn',
      'zao': 'tảo', 'wan': 'vãn', 'xin': 'tân', 'jiu': 'cựu',
      'rong': 'dung', 'yi': 'dị', 'nan': 'nan', 'dui': 'đối',
      'cuo': 'thác', 'zhen': 'chân', 'jia': 'giả', 'gao': 'cao',
      'ai': 'ngải', 'chang': 'trường', 'duan': 'đoản', 'kuan': 'khoan',
      'zhai': 'tiệp', 'hou': 'hầu', 'bao': 'bác', 'zhong': 'trọng',
      'qing': 'khinh', 're': 'nhiệt', 'leng': 'lãnh', 'nuan': 'noãn',
      'liang': 'lương', 'gan': 'can', 'shi': 'thấp', 'jing': 'tịnh',
      'zang': 'tạng', 'mei': 'mỹ', 'li': 'lệ', 'chou': 'xú',
      'mang': 'mang', 'xian': 'nhàn', 'lei': 'luỵ', 'e': 'ngạ',
      'ke': 'khát', 'kun': 'khốn', 'bing': 'bệnh', 'huai': 'hoại',
      'zuo': 'tả', 'you': 'hữu', 'dong': 'đông', 'xi': 'tây',
      'nan': 'nam', 'bei': 'bắc', 'shang': 'thượng', 'xia': 'hạ',
      'qian': 'tiền', 'hou': 'hậu', 'li': 'lý', 'wai': 'ngoại',
      'jin': 'cận', 'yuan': 'viễn',
    };

    return mapping[syl] || syl;
  }).join(' ');
}

// ── Helper Functions ───────────────────────────────────────────────────────
function log(msg: string) { process.stdout.write(msg + '\n'); }
function ok(msg: string)  { log(`\x1b[32m✓\x1b[0m ${msg}`); }
function info(msg: string){ log(`\x1b[36mℹ\x1b[0m ${msg}`); }
function warn(msg: string){ log(`\x1b[33m⚠\x1b[0m ${msg}`); }
function err(msg: string) { log(`\x1b[31m✗\x1b[0m ${msg}`); }

function removeTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ǖǘǚǜ]/g, 'u')
    .toLowerCase()
    .trim();
}

function getFirstLetter(pinyin: string | null | undefined): string {
  if (!pinyin) return 'misc';
  const plain = removeTones(pinyin);
  const first = plain.charAt(0).toLowerCase();
  if (first >= 'a' && first <= 'z') return first;
  return 'misc';
}

// ── Data Sources ─────────────────────────────────────────────────────────────
const DATA_SOURCES = {
  // CC-CEDICT parsed JSON - multiple sources
  cedict: {
    name: 'CC-CEDICT Dictionary',
    urls: [
      'https://raw.githubusercontent.com/nickymeow/cedict-json/main/cedict.json',
      'https://raw.githubusercontent.com/nickymeow/cedict-json/master/cedict.json',
      'https://cdn.jsdelivr.net/gh/nickymeow/cedict-json@main/cedict.json',
    ],
    parser: 'json',
  },
  // HSK vocabulary from various sources
  hsk: {
    name: 'HSK Vocabulary',
    urls: [
      'https://raw.githubusercontent.com/iKenand/Chinese-HSK-Vocabulary-List/main/data.json',
      'https://raw.githubusercontent.com/iKenand/Chinese-HSK-Vocabulary-List/master/data.json',
    ],
    parser: 'hsk',
  },
  // Another dictionary source
  chinese: {
    name: 'Chinese Dictionary',
    urls: [
      'https://raw.githubusercontent.com/nickymeow/chinese-dictionary/main/data.json',
      'https://raw.githubusercontent.com/nickymeow/chinese-dictionary/master/data.json',
    ],
    parser: 'json',
  },
  // Built-in sample data as fallback
  sample: {
    name: 'Sample Data (built-in)',
    urls: [],
    parser: 'sample',
  }
};

// ── Parsers ─────────────────────────────────────────────────────────────────

function parseCEDICT(content: string): DictEntry[] {
  const entries: DictEntry[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;

    // Format: Traditional Simplified [pinyin] /def1/def2/.../
    const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
    if (!match) continue;

    const [, traditional, simplified, pinyin, defs] = match;
    const definitions = defs.split('/').filter(d => d.trim());

    // Try to find Vietnamese definition (if label exists)
    const viDef = definitions.find(d =>
      d.toLowerCase().includes('vietnamese:') ||
      d.toLowerCase().includes('vi:')
    );

    let vietnamese = viDef
      ? viDef.replace(/^Vietnamese:\s*/i, '').replace(/^vi:\s*/i, '').trim()
      : definitions[0]; // Use first English definition if no Vietnamese

    entries.push({
      simplified,
      traditional: traditional !== simplified ? traditional : '',
      pinyin: pinyin.trim(),
      hanviet: convertToHanviet(pinyin),
      vietnamese: vietnamese.substring(0, 200), // Limit length
    });
  }

  return entries;
}

function parseJSONData(data: any[]): DictEntry[] {
  const entries: DictEntry[] = [];

  for (const item of data) {
    // Handle various JSON formats
    const simplified = item.simplified || item.simp || item.word || item.hanzi;
    const traditional = item.traditional || item.trad || '';
    const pinyin = item.pinyin || item.reading || '';
    const vietnamese = item.vietnamese || item.vi || item.definition || item.def || item.meaning || '';

    if (!simplified || !vietnamese) continue;

    entries.push({
      simplified,
      traditional: traditional !== simplified ? traditional : '',
      pinyin,
      hanviet: item.hanviet || item.hanviet || convertToHanviet(pinyin),
      vietnamese: typeof vietnamese === 'string' ? vietnamese : vietnamese.join(', '),
    });
  }

  return entries;
}

function generateSampleData(): DictEntry[] {
  // First try to load existing sample_dictionary.json
  const samplePath = SAMPLE_FILE;
  if (existsSync(samplePath)) {
    const content = readFileSync(samplePath, 'utf-8');
    try {
      const sample = JSON.parse(content);
      if (Array.isArray(sample) && sample.length > 0) {
        return sample;
      }
    } catch (e) {
      warn('Could not parse sample file');
    }
  }

  // Comprehensive HSK1-4 vocabulary list (500+ common words)
  const hskData: DictEntry[] = [
    // HSK 1 - Basic
    { simplified: '爱', traditional: '愛', pinyin: 'ài', hanviet: 'ái', vietnamese: ' yêu' },
    { simplified: '爸爸', traditional: '爸爸', pinyin: 'bà ba', hanviet: 'ba ba', vietnamese: 'Bố, cha' },
    { simplified: '杯子', traditional: '杯子', pinyin: 'bēi zi', hanviet: 'bôi tử', vietnamese: 'Cái cốc, ly' },
    { simplified: '北京', traditional: '北京', pinyin: 'běi jīng', hanviet: 'bắc kinh', vietnamese: 'Bắc Kinh' },
    { simplified: '大', traditional: '大', pinyin: 'dà', hanviet: 'đại', vietnamese: 'To, lớn' },
    { simplified: '弟弟', traditional: '弟弟', pinyin: 'dì di', hanviet: 'đệ đệ', vietnamese: 'Em trai' },
    { simplified: '都', traditional: '都', pinyin: 'dōu', hanviet: 'đô', vietnamese: 'Đều, cả' },
    { simplified: '对', traditional: '對', pinyin: 'duì', hanviet: 'đối', vietnamese: 'Đúng, phải' },
    { simplified: '多', traditional: '多', pinyin: 'duō', hanviet: 'đa', vietnamese: 'Nhiều' },
    { simplified: '饿', traditional: '餓', pinyin: 'è', hanviet: 'ngạ', vietnamese: 'Đói' },
    { simplified: '儿子', traditional: '兒子', pinyin: 'ér zi', hanviet: 'nhi tử', vietnamese: 'Con trai' },
    { simplified: '飞', traditional: '飛', pinyin: 'fēi', hanviet: 'phi', vietnamese: 'Bay' },
    { simplified: '分钟', traditional: '分鐘', pinyin: 'fēn zhōng', hanviet: 'phân chung', vietnamese: 'Phút' },
    { simplified: '高兴', traditional: '高興', pinyin: 'gāo xìng', hanviet: 'cao hứng', vietnamese: 'Vui vẻ' },
    { simplified: '个', traditional: '個', pinyin: 'gè', hanviet: 'cá', vietnamese: 'Cái (lượng từ)' },
    { simplified: '工作', traditional: '工作', pinyin: 'gōng zuò', hanviet: 'công tác', vietnamese: 'Công việc' },
    { simplified: '狗', traditional: '狗', pinyin: 'gǒu', hanviet: 'cẩu', vietnamese: 'Chó' },
    { simplified: '贵', traditional: '貴', pinyin: 'guì', hanviet: 'quý', vietnamese: 'Đắt' },
    { simplified: '过', traditional: '過', pinyin: 'guò', hanviet: 'quá', vietnamese: 'Qua, trải qua' },
    { simplified: '还', traditional: '還', pinyin: 'hái', hanviet: 'hoàn', vietnamese: 'Còn, vẫn' },
    { simplified: '和', traditional: '和', pinyin: 'hé', hanviet: 'hòa', vietnamese: 'Và, với' },
    { simplified: '喝', traditional: '喝', pinyin: 'hē', hanviet: 'hát', vietnamese: 'Uống' },
    { simplified: '很', traditional: '很', pinyin: 'hěn', hanviet: 'ngận', vietnamese: 'Rất' },
    { simplified: '红', traditional: '紅', pinyin: 'hóng', hanviet: 'hồng', vietnamese: 'Màu đỏ' },
    { simplified: '花儿', traditional: '花兒', pinyin: 'huā er', hanviet: 'hoa nhi', vietnamese: 'Hoa' },
    { simplified: '会', traditional: '會', pinyin: 'huì', hanviet: 'hội', vietnamese: 'Biết, sẽ' },
    { simplified: '几', traditional: '幾', pinyin: 'jǐ', hanviet: 'kỷ', vietnamese: 'Mấy, bao nhiêu' },
    { simplified: '家', traditional: '家', pinyin: 'jiā', hanviet: 'gia', vietnamese: 'Nhà, gia đình' },
    { simplified: '叫', traditional: '叫', pinyin: 'jiào', hanviet: 'khiếu', vietnamese: 'Gọi, tên là' },
    { simplified: '今天', traditional: '今天', pinyin: 'jīn tiān', hanviet: 'kim thiên', vietnamese: 'Hôm nay' },
    { simplified: '九', traditional: '九', pinyin: 'jiǔ', hanviet: 'cửu', vietnamese: 'Chín' },
    { simplified: '开', traditional: '開', pinyin: 'kāi', hanviet: 'khai', vietnamese: 'Mở' },
    { simplified: '看', traditional: '看', pinyin: 'kàn', hanviet: 'khán', vietnamese: 'Nhìn, xem' },
    { simplified: '看见', traditional: '看見', pinyin: 'kàn jiàn', hanviet: 'khán kiến', vietnamese: 'Nhìn thấy' },
    { simplified: '哥哥', traditional: '哥哥', pinyin: 'gē ge', hanviet: 'ca ca', vietnamese: 'Anh trai' },
    { simplified: '姐姐', traditional: '姐姐', pinyin: 'jiě jie', hanviet: 'tỷ tỷ', vietnamese: 'Chị gái' },
    { simplified: '块', traditional: '塊', pinyin: 'kuài', hanviet: 'khối', vietnamese: 'Miếng, khối' },
    { simplified: '来', traditional: '來', pinyin: 'lái', hanviet: 'lai', vietnamese: 'Đến' },
    { simplified: '老', traditional: '老', pinyin: 'lǎo', hanviet: 'lão', vietnamese: 'Già, cũ' },
    { simplified: '老师', traditional: '老師', pinyin: 'lǎo shī', hanviet: 'lão sư', vietnamese: 'Giáo viên' },
    { simplified: '了', traditional: '了', pinyin: 'le', hanviet: 'liễu', vietnamese: 'Đã (trợ từ)' },
    { simplified: '冷', traditional: '冷', pinyin: 'lěng', hanviet: 'lãnh', vietnamese: 'Lạnh' },
    { simplified: '里', traditional: '裏', pinyin: 'lǐ', hanviet: 'lý', vietnamese: 'Trong, bên trong' },
    { simplified: '六', traditional: '六', pinyin: 'liù', hanviet: 'lục', vietnamese: 'Sáu' },
    { simplified: '妈妈', traditional: '媽媽', pinyin: 'mā ma', hanviet: 'ma ma', vietnamese: 'Mẹ' },
    { simplified: '吗', traditional: '嗎', pinyin: 'ma', hanviet: 'ma', vietnamese: '(trợ từ hỏi)' },
    { simplified: '买', traditional: '買', pinyin: 'mǎi', hanviet: 'mãi', vietnamese: 'Mua' },
    { simplified: '猫', traditional: '貓', pinyin: 'māo', hanviet: 'mao', vietnamese: 'Mèo' },
    { simplified: '没关系', traditional: '沒關係', pinyin: 'méi guān xi', hanviet: 'vô quan hệ', vietnamese: 'Không sao' },
    { simplified: '没有', traditional: '沒有', pinyin: 'méi yǒu', hanviet: 'vô hữu', vietnamese: 'Không có' },
    { simplified: '米饭', traditional: '米飯', pinyin: 'mǐ fàn', hanviet: 'mễ phạn', vietnamese: 'Cơm' },
    { simplified: '名字', traditional: '名字', pinyin: 'míng zi', hanviet: 'danh tự', vietnamese: 'Tên' },
    { simplified: '明天', traditional: '明天', pinyin: 'míng tiān', hanviet: 'minh thiên', vietnamese: 'Ngày mai' },
    { simplified: '哪', traditional: '哪', pinyin: 'nǎ', hanviet: 'na', vietnamese: 'Nào' },
    { simplified: '那', traditional: '那', pinyin: 'nà', hanviet: 'na', vietnamese: 'Kia, đó' },
    { simplified: '呢', traditional: '呢', pinyin: 'ne', hanviet: 'ni', vietnamese: '(trợ từ)' },
    { simplified: '能', traditional: '能', pinyin: 'néng', hanviet: 'năng', vietnamese: 'Có thể' },
    { simplified: '你', traditional: '你', pinyin: 'nǐ', hanviet: 'nễ', vietnamese: 'Bạn, anh' },
    { simplified: '年', traditional: '年', pinyin: 'nián', hanviet: 'niên', vietnamese: 'Năm' },
    { simplified: '女儿', traditional: '女兒', pinyin: 'nǚ ér', hanviet: 'nữ nhi', vietnamese: 'Con gái' },
    { simplified: '朋友', traditional: '朋友', pinyin: 'péng yǒu', hanviet: 'bằng hữu', vietnamese: 'Bạn bè' },
    { simplified: '便宜', traditional: '便宜', pinyin: 'pián yi', hanviet: 'tiện nghi', vietnamese: 'Rẻ' },
    { simplified: '苹果', traditional: '蘋果', pinyin: 'píng guǒ', hanviet: 'bình quả', vietnamese: 'Táo' },
    { simplified: '七', traditional: '七', pinyin: 'qī', hanviet: 'thất', vietnamese: 'Bảy' },
    { simplified: '前', traditional: '前', pinyin: 'qián', hanviet: 'tiền', vietnamese: 'Trước' },
    { simplified: '钱', traditional: '錢', pinyin: 'qián', hanviet: 'tiền', vietnamese: 'Tiền' },
    { simplified: '请', traditional: '請', pinyin: 'qǐng', hanviet: 'thỉnh', vietnamese: 'Mời, xin' },
    { simplified: '去', traditional: '去', pinyin: 'qù', hanviet: 'khứ', vietnamese: 'Đi' },
    { simplified: '日', traditional: '日', pinyin: 'rì', hanviet: 'nhật', vietnamese: 'Ngày, mặt trời' },
    { simplified: '热', traditional: '熱', pinyin: 'rè', hanviet: 'nhiệt', vietnamese: 'Nóng' },
    { simplified: '人', traditional: '人', pinyin: 'rén', hanviet: 'nhân', vietnamese: 'Người' },
    { simplified: '认识', traditional: '認識', pinyin: 'rèn shi', hanviet: 'nhận thức', vietnamese: 'Biết, nhận ra' },
    { simplified: '日', traditional: '日', pinyin: 'rì', hanviet: 'nhật', vietnamese: 'Ngày' },
    { simplified: '三', traditional: '三', pinyin: 'sān', hanviet: 'tam', vietnamese: 'Ba' },
    { simplified: '商店', traditional: '商店', pinyin: 'shāng diàn', hanviet: 'thương điếm', vietnamese: 'Cửa hàng' },
    { simplified: '上', traditional: '上', pinyin: 'shàng', hanviet: 'thượng', vietnamese: 'Trên, lên' },
    { simplified: '上午', traditional: '上午', pinyin: 'shàng wǔ', hanviet: 'thượng ngọ', vietnamese: 'Buổi sáng' },
    { simplified: '少', traditional: '少', pinyin: 'shǎo', hanviet: 'thiểu', vietnamese: 'Ít' },
    { simplified: '谁', traditional: '誰', pinyin: 'shéi', hanviet: 'thùy', vietnamese: 'Ai' },
    { simplified: '什么', traditional: '什麼', pinyin: 'shén me', hanviet: 'thập ma', vietnamese: 'Cái gì' },
    { simplified: '十', traditional: '十', pinyin: 'shí', hanviet: 'thập', vietnamese: 'Mười' },
    { simplified: '时候', traditional: '時候', pinyin: 'shí hou', hanviet: 'thì hầu', vietnamese: 'Thời gian, lúc' },
    { simplified: '是', traditional: '是', pinyin: 'shì', hanviet: 'thị', vietnamese: 'Là' },
    { simplified: '书', traditional: '書', pinyin: 'shū', hanviet: 'thư', vietnamese: 'Sách' },
    { simplified: '水', traditional: '水', pinyin: 'shuǐ', hanviet: 'thủy', vietnamese: 'Nước' },
    { simplified: '说', traditional: '說', pinyin: 'shuō', hanviet: 'thuyết', vietnamese: 'Nói' },
    { simplified: '四', traditional: '四', pinyin: 'sì', hanviet: 'tứ', vietnamese: 'Bốn' },
    { simplified: '岁', traditional: '歲', pinyin: 'suì', hanviet: 'tuế', vietnamese: 'Tuổi' },
    { simplified: '他', traditional: '他', pinyin: 'tā', hanviet: 'tha', vietnamese: 'Anh ấy, ông ấy' },
    { simplified: '她', traditional: '她', pinyin: 'tā', hanviet: 'tha', vietnamese: 'Cô ấy, bà ấy' },
    { simplified: '太', traditional: '太', pinyin: 'tài', hanviet: 'thái', vietnamese: 'Quá, quá mức' },
    { simplified: '天', traditional: '天', pinyin: 'tiān', hanviet: 'thiên', vietnamese: 'Trời, ngày' },
    { simplified: '听', traditional: '聽', pinyin: 'tīng', hanviet: 'thính', vietnamese: 'Nghe' },
    { simplified: '同学', traditional: '同學', pinyin: 'tóng xué', hanviet: 'đồng học', vietnamese: 'Bạn học' },
    { simplified: '喂', traditional: '喂', pinyin: 'wèi', hanviet: 'vị', vietnamese: 'A lô' },
    { simplified: '我', traditional: '我', pinyin: 'wǒ', hanviet: 'ngã', vietnamese: 'Tôi, tao' },
    { simplified: '我们', traditional: '我們', pinyin: 'wǒ men', hanviet: 'ngã môn', vietnamese: 'Chúng tôi, chúng ta' },
    { simplified: '五', traditional: '五', pinyin: 'wǔ', hanviet: 'ngũ', vietnamese: 'Năm' },
    { simplified: '喜欢', traditional: '喜歡', pinyin: 'xǐ huan', hanviet: 'hỷ hoan', vietnamese: 'Thích' },
    { simplified: '下', traditional: '下', pinyin: 'xià', hanviet: 'hạ', vietnamese: 'Xuống, dưới' },
    { simplified: '下午', traditional: '下午', pinyin: 'xià wǔ', hanviet: 'hạ ngọ', vietnamese: 'Buổi chiều' },
    { simplified: '下雨', traditional: '下雨', pinyin: 'xià yǔ', hanviet: 'hạ vũ', vietnamese: 'Trời mưa' },
    { simplified: '先生', traditional: '先生', pinyin: 'xiān sheng', hanviet: 'tiên sinh', vietnamese: 'Ông, ngài' },
    { simplified: '现在', traditional: '現在', pinyin: 'xiàn zài', hanviet: 'hiện tại', vietnamese: 'Bây giờ' },
    { simplified: '想', traditional: '想', pinyin: 'xiǎng', hanviet: 'tưởng', vietnamese: 'Muốn, nghĩ' },
    { simplified: '小', traditional: '小', pinyin: 'xiǎo', hanviet: 'tiểu', vietnamese: 'Nhỏ, bé' },
    { simplified: '小姐', traditional: '小姐', pinyin: 'xiǎo jie', hanviet: 'tiểu tỷ', vietnamese: 'Cô, tiểu thư' },
    { simplified: '些', traditional: '些', pinyin: 'xiē', hanviet: 'ta', vietnamese: 'Vài, một ít' },
    { simplified: '写', traditional: '寫', pinyin: 'xiě', hanviet: 'tả', vietnamese: 'Viết' },
    { simplified: '谢谢', traditional: '謝謝', pinyin: 'xiè xie', hanviet: 'tạ tạ', vietnamese: 'Cảm ơn' },
    { simplified: '星期', traditional: '星期', pinyin: 'xīng qī', hanviet: 'tinh kỳ', vietnamese: 'Tuần' },
    { simplified: '姓', traditional: '姓', pinyin: 'xìng', hanviet: 'tánh', vietnamese: 'Họ' },
    { simplified: '学生', traditional: '學生', pinyin: 'xué sheng', hanviet: 'học sinh', vietnamese: 'Học sinh' },
    { simplified: '学习', traditional: '學習', pinyin: 'xué xí', hanviet: 'học tập', vietnamese: 'Học' },
    { simplified: '学校', traditional: '學校', pinyin: 'xué xiào', hanviet: 'học hiệu', vietnamese: 'Trường học' },
    { simplified: '一', traditional: '一', pinyin: 'yī', hanviet: 'nhất', vietnamese: 'Một' },
    { simplified: '一点儿', traditional: '一點兒', pinyin: 'yì diǎn er', hanviet: 'nhất điểm nhi', vietnamese: 'Một chút' },
    { simplified: '医生', traditional: '醫生', pinyin: 'yī shēng', hanviet: 'y sinh', vietnamese: 'Bác sĩ' },
    { simplified: '医院', traditional: '醫院', pinyin: 'yī yuàn', hanviet: 'y viện', vietnamese: 'Bệnh viện' },
    { simplified: '衣服', traditional: '衣服', pinyin: 'yī fu', hanviet: 'y phục', vietnamese: 'Quần áo' },
    { simplified: '以后', traditional: '以後', pinyin: 'yǐ hòu', hanviet: 'dĩ hậu', vietnamese: 'Sau đó' },
    { simplified: '椅子', traditional: '椅子', pinyin: 'yǐ zi', hanviet: 'ỷ tử', vietnamese: 'Cái ghế' },
    { simplified: '有', traditional: '有', pinyin: 'yǒu', hanviet: 'hữu', vietnamese: 'Có' },
    { simplified: '月', traditional: '月', pinyin: 'yuè', hanviet: 'nguyệt', vietnamese: 'Tháng, mặt trăng' },
    { simplified: '再', traditional: '再', pinyin: 'zài', hanviet: 'tái', vietnamese: 'Lại, nữa' },
    { simplified: '再见', traditional: '再見', pinyin: 'zài jiàn', hanviet: 'tái kiến', vietnamese: 'Tạm biệt' },
    { simplified: '在', traditional: '在', pinyin: 'zài', hanviet: 'tại', vietnamese: 'Ở, tại' },
    { simplified: '怎么', traditional: '怎麼', pinyin: 'zěn me', hanviet: 'chẩm ma', vietnamese: 'Như thế nào' },
    { simplified: '怎么样', traditional: '怎麼樣', pinyin: 'zěn me yàng', hanviet: 'chẩm ma dạng', vietnamese: 'Thế nào' },
    { simplified: '站', traditional: '站', pinyin: 'zhàn', hanviet: 'trạm', vietnamese: 'Đứng, ga' },
    { simplified: '这', traditional: '這', pinyin: 'zhè', hanviet: 'giá', vietnamese: 'Đây, này' },
    { simplified: '中国', traditional: '中國', pinyin: 'zhōng guó', hanviet: 'trung quốc', vietnamese: 'Trung Quốc' },
    { simplified: '中午', traditional: '中午', pinyin: 'zhōng wǔ', hanviet: 'trung ngọ', vietnamese: 'Buổi trưa' },
    { simplified: '住', traditional: '住', pinyin: 'zhù', hanviet: 'trụ', vietnamese: 'Ở, sống' },
    { simplified: '桌子', traditional: '桌子', pinyin: 'zhuō zi', hanviet: 'trác tử', vietnamese: 'Cái bàn' },
    { simplified: '字', traditional: '字', pinyin: 'zì', hanviet: 'tự', vietnamese: 'Chữ' },
    { simplified: '昨天', traditional: '昨天', pinyin: 'zuó tiān', hanviet: 'tạc thiên', vietnamese: 'Hôm qua' },
    { simplified: '做', traditional: '做', pinyin: 'zuò', hanviet: 'tác', vietnamese: 'Làm' },
    { simplified: '坐', traditional: '坐', pinyin: 'zuò', hanviet: 'tọa', vietnamese: 'Ngồi' },

    // HSK 2 - Elementary
    { simplified: '把', traditional: '把', pinyin: 'bǎ', hanviet: 'bả', vietnamese: 'Cầm, giữ (trợ từ)' },
    { simplified: '班', traditional: '班', pinyin: 'bān', hanviet: 'ban', vietnamese: 'Lớp, ca làm việc' },
    { simplified: '搬', traditional: '搬', pinyin: 'bān', hanviet: 'ban', vietnamese: 'Chuyển nhà' },
    { simplified: '办法', traditional: '辦法', pinyin: 'bàn fǎ', hanviet: 'biện pháp', vietnamese: 'Cách, phương pháp' },
    { simplified: '半', traditional: '半', pinyin: 'bàn', hanviet: 'bán', vietnamese: 'Nửa' },
    { simplified: '帮助', traditional: '幫助', pinyin: 'bāng zhù', hanviet: 'bang trợ', vietnamese: 'Giúp đỡ' },
    { simplified: '便宜', traditional: '便宜', pinyin: 'pián yi', hanviet: 'tiện nghi', vietnamese: 'Rẻ' },
    { simplified: '别', traditional: '別', pinyin: 'bié', hanviet: 'biệt', vietnamese: 'Đừng' },
    { simplified: '宾馆', traditional: '賓館', pinyin: 'bīn guǎn', hanviet: 'tân quán', vietnamese: 'Khách sạn' },
    { simplified: '冰箱', traditional: '冰箱', pinyin: 'bīng xiāng', hanviet: 'băng tường', vietnamese: 'Tủ lạnh' },
    { simplified: '不但', traditional: '不但', pinyin: 'bú dàn', hanviet: 'bất đãn', vietnamese: 'Không những' },
    { simplified: '菜', traditional: '菜', pinyin: 'cài', hanviet: 'thài', vietnamese: 'Món ăn, rau' },
    { simplified: '餐厅', traditional: '餐廳', pinyin: 'cān tīng', hanviet: 'thinh thính', vietnamese: 'Nhà hàng' },
    { simplified: '草', traditional: '草', pinyin: 'cǎo', hanviet: 'thảo', vietnamese: 'Cỏ' },
    { simplified: '层', traditional: '層', pinyin: 'céng', hanviet: 'tằng', vietnamese: 'Tầng' },
    { simplified: '茶', traditional: '茶', pinyin: 'chá', hanviet: 'trà', vietnamese: 'Trà' },
    { simplified: '差不多', traditional: '差不多', pinyin: 'chà bu duō', hanviet: 'sai bất đa', vietnamese: 'Gần như' },
    { simplified: '长', traditional: '長', pinyin: 'cháng', hanviet: 'trường', vietnamese: 'Dài' },
    { simplified: '城市', traditional: '城市', pinyin: 'chéng shì', hanviet: 'thành thị', vietnamese: 'Thành phố' },
    { simplified: '迟到', traditional: '遲到', pinyin: 'chí dào', hanviet: 'trì đáo', vietnamese: 'Đến muộn' },
    { simplified: '吃饭', traditional: '吃飯', pinyin: 'chī fàn', hanviet: 'xực phạn', vietnamese: 'Ăn cơm' },
    { simplified: '出', traditional: '出', pinyin: 'chū', hanviet: 'xuất', vietnamese: 'Ra, đi ra' },
    { simplified: '除了', traditional: '除了', pinyin: 'chú le', hanviet: 'trừ liễu', vietnamese: 'Ngoài ra' },
    { simplified: '船', traditional: '船', pinyin: 'chuán', hanviet: 'thuyền', vietnamese: 'Thuyền, tàu' },
    { simplified: '春', traditional: '春', pinyin: 'chūn', hanviet: 'xuân', vietnamese: 'Mùa xuân' },
    { simplified: '词语', traditional: '詞語', pinyin: 'cí yǔ', hanviet: 'từ ngữ', vietnamese: 'Từ ngữ' },
    { simplified: '次', traditional: '次', pinyin: 'cì', hanviet: 'thứ', vietnamese: 'Lần' },
    { simplified: '聪明', traditional: '聰明', pinyin: 'cōng ming', hanviet: 'thông minh', vietnamese: 'Thông minh' },
    { simplified: '打', traditional: '打', pinyin: 'dǎ', hanviet: 'đả', vietnamese: 'Đánh' },
    { simplified: '打扫', traditional: '打掃', pinyin: 'dǎ sǎo', hanviet: 'đả tảo', vietnamese: 'Dọn dẹp' },
    { simplified: '大家', traditional: '大家', pinyin: 'dà jiā', hanviet: 'đại gia', vietnamese: 'Mọi người' },
    { simplified: '答题', traditional: '答題', pinyin: 'dá tí', hanviet: 'đáp đề', vietnamese: 'Trả lời' },
    { simplified: '打车', traditional: '打車', pinyin: 'dǎ chē', hanviet: 'đả xa', vietnamese: 'Bắt xe' },
    { simplified: '带', traditional: '帶', pinyin: 'dài', hanviet: 'đái', vietnamese: 'Mang, đem' },
    { simplified: '蛋糕', traditional: '蛋糕', pinyin: 'dàn gāo', hanviet: 'đản cao', vietnamese: 'Bánh ngọt' },
    { simplified: '得', traditional: '得', pinyin: 'de', hanviet: 'đắc', vietnamese: 'Được (trợ từ)' },
    { simplified: '地点', traditional: '地點', pinyin: 'dì diǎn', hanviet: 'địa điểm', vietnamese: 'Địa điểm' },
    { simplified: '地铁', traditional: '地鐵', pinyin: 'dì tiě', hanviet: 'địa thiết', vietnamese: 'Tàu điện ngầm' },
    { simplified: '地图', traditional: '地圖', pinyin: 'dì tú', hanviet: 'địa đồ', vietnamese: 'Bản đồ' },
    { simplified: '弟弟', traditional: '弟弟', pinyin: 'dì di', hanviet: 'đệ đệ', vietnamese: 'Em trai' },
    { simplified: '第一', traditional: '第一', pinyin: 'dì yī', hanviet: 'đệ nhất', vietnamese: 'Thứ nhất' },
    { simplified: '懂', traditional: '懂', pinyin: 'dǒng', hanviet: 'đổng', vietnamese: 'Hiểu' },
    { simplified: '动物', traditional: '動物', pinyin: 'dòng wù', hanviet: 'động vật', vietnamese: 'Động vật' },
    { simplified: '短', traditional: '短', pinyin: 'duǎn', hanviet: 'đoản', vietnamese: 'Ngắn' },
    { simplified: '对', traditional: '對', pinyin: 'duì', hanviet: 'đối', vietnamese: 'Đúng' },
    { simplified: '饿', traditional: '餓', pinyin: 'è', hanviet: 'ngạ', vietnamese: 'Đói' },
    { simplified: '耳朵', traditional: '耳朵', pinyin: 'ěr duo', hanviet: 'nhĩ đa', vietnamese: 'Tai' },
    { simplified: '发烧', traditional: '發燒', pinyin: 'fā shāo', hanviet: 'phát thiêu', vietnamese: 'Sốt' },
    { simplified: '发现', traditional: '發現', pinyin: 'fā xiàn', hanviet: 'phát hiện', vietnamese: 'Phát hiện' },
    { simplified: '方便', traditional: '方便', pinyin: 'fāng biàn', hanviet: 'phương tiện', vietnamese: 'Tiện lợi' },
    { simplified: '放', traditional: '放', pinyin: 'fàng', hanviet: 'phóng', vietnamese: 'Đặt, thả' },
    { simplified: '放学', traditional: '放學', pinyin: 'fàng xué', hanviet: 'phóng học', vietnamese: 'Tan học' },
    { simplified: '分', traditional: '分', pinyin: 'fēn', hanviet: 'phân', vietnamese: 'Phút, chia' },
    { simplified: '服务员', traditional: '服務員', pinyin: 'fú wù yuán', hanviet: 'phục vụ viên', vietnamese: 'Nhân viên phục vụ' },
    { simplified: '附近', traditional: '附近', pinyin: 'fù jìn', hanviet: 'phụ cận', vietnamese: 'Gần đây' },
    { simplified: '干净', traditional: '乾淨', pinyin: 'gān jìng', hanviet: 'can tịnh', vietnamese: 'Sạch sẽ' },
    { simplified: '哥哥', traditional: '哥哥', pinyin: 'gē ge', hanviet: 'ca ca', vietnamese: 'Anh trai' },
    { simplified: '告诉', traditional: '告訴', pinyin: 'gào su', hanviet: 'cáo tố', vietnamese: 'Cho biết, nói' },
    { simplified: '公共汽车', traditional: '公共汽車', pinyin: 'gōng gòng qì chē', hanviet: 'công cộng khí xa', vietnamese: 'Xe buýt' },
    { simplified: '公园', traditional: '公園', pinyin: 'gōng yuán', hanviet: 'công viên', vietnamese: 'Công viên' },
    { simplified: '故事', traditional: '故事', pinyin: 'gù shi', hanviet: 'cố sự', vietnamese: 'Câu chuyện' },
    { simplified: '关', traditional: '關', pinyin: 'guān', hanviet: 'quan', vietnamese: 'Đóng' },
    { simplified: '关机', traditional: '關機', pinyin: 'guān jī', hanviet: 'quan cơ', vietnamese: 'Tắt máy' },
    { simplified: '关心', traditional: '關心', pinyin: 'guān xīn', hanviet: 'quan tâm', vietnamese: 'Quan tâm' },
    { simplified: '关于', traditional: '關於', pinyin: 'guān yú', hanviet: 'quan ư', vietnamese: 'Về' },
    { simplified: '贵', traditional: '貴', pinyin: 'guì', hanviet: 'quý', vietnamese: 'Đắt' },
    { simplified: '过', traditional: '過', pinyin: 'guò', hanvey: 'quá', vietnamese: 'Qua' },
    { simplified: '过', traditional: '過', pinyin: 'guò', hanviet: 'quá', vietnamese: 'Qua' },
    { simplified: '还是', traditional: '還是', pinyin: 'hái shì', hanviet: 'hoàn thị', vietnamese: 'Hay là' },
    { simplified: '孩子', traditional: '孩子', pinyin: 'hái zi', hanviet: 'hài tử', vietnamese: 'Trẻ con' },
    { simplified: '黑', traditional: '黑', pinyin: 'hēi', hanviet: 'hắc', vietnamese: 'Đen' },
    { simplified: '黑板', traditional: '黑板', pinyin: 'hēi bǎn', hanviet: 'hắc bản', vietnamese: 'Bảng đen' },
    { simplified: '红', traditional: '紅', pinyin: 'hóng', hanviet: 'hồng', vietnamese: 'Đỏ' },
    { simplified: '花', traditional: '花', pinyin: 'huā', hanviet: 'hoa', vietnamese: 'Hoa' },
    { simplified: '画', traditional: '畫', pinyin: 'huà', hanviet: 'họa', vietnamese: 'Vẽ' },
    { simplified: '坏', traditional: '壞', pinyin: 'huài', hanviet: 'hoại', vietnamese: 'Hỏng, xấu' },
    { simplified: '欢迎', traditional: '歡迎', pinyin: 'huān yíng', hanviet: 'hoan nghênh', vietnamese: 'Chào mừng' },
    { simplified: '还', traditional: '還', pinyin: 'huán', hanviet: 'hoàn', vietnamese: 'Trả lại' },
    { simplified: '换', traditional: '換', pinyin: 'huàn', hanviet: 'hoán', vietnamese: 'Đổi' },
    { simplified: '黄', traditional: '黃', pinyin: 'huáng', hanviet: 'hoàng', vietnamese: 'Vàng' },
    { simplified: '房间', traditional: '房間', pinyin: 'fáng jiān', hanviet: 'phòng gian', vietnamese: 'Phòng' },
    { simplified: '机场', traditional: '機場', pinyin: 'jī chǎng', hanviet: 'cơ trường', vietnamese: 'Sân bay' },
    { simplified: '鸡蛋', traditional: '雞蛋', pinyin: 'jī dàn', hanviet: 'kê đản', vietnamese: 'Trứng gà' },
    { simplified: '机场', traditional: '機場', pinyin: 'jī chǎng', hanviet: 'cơ trường', vietnamese: 'Sân bay' },
    { simplified: '机', traditional: '機', pinyin: 'jī', hanviet: 'cơ', vietnamese: 'Máy' },
    { simplified: '机会', traditional: '機會', pinyin: 'jī huì', hanviet: 'cơ hội', vietnamese: 'Cơ hội' },
    { simplified: '姐姐', traditional: '姐姐', pinyin: 'jiě jie', hanviet: 'tỷ tỷ', vietnamese: 'Chị gái' },
    { simplified: '解决', traditional: '解決', pinyin: 'jiě jué', hanviet: 'giải quyết', vietnamese: 'Giải quyết' },
    { simplified: '节课', traditional: '節課', pinyin: 'jié kè', hanviet: 'tiết khóa', vietnamese: 'Tiết học' },
    { simplified: '借', traditional: '借', pinyin: 'jiè', hanviet: 'tá', vietnamese: 'Mượn' },
    { simplified: '经常', traditional: '經常', pinyin: 'jīng cháng', hanviet: 'kinh thường', vietnamese: 'Thường xuyên' },
    { simplified: '经过', traditional: '經過', pinyin: 'jīng guò', hanviet: 'kinh quá', vietnamese: 'Đi qua' },
    { simplified: '旧', traditional: '舊', pinyin: 'jiù', hanviet: 'cựu', vietnamese: 'Cũ' },
    { simplified: '决定', traditional: '決定', pinyin: 'jué dìng', hanviet: 'quyết định', vietnamese: 'Quyết định' },
    { simplified: '可爱', traditional: '可愛', pinyin: 'kě ài', hanviet: 'khả ái', vietnamese: 'Dễ thương' },
    { simplified: '可是', traditional: '可是', pinyin: 'kě shì', hanviet: 'khả thị', vietnamese: 'Nhưng mà' },
    { simplified: '可以', traditional: '可以', pinyin: 'kě yǐ', hanviet: 'khả dĩ', vietnamese: 'Có thể' },
    { simplified: '哭', traditional: '哭', pinyin: 'kū', hanviet: 'khốc', vietnamese: 'Khóc' },
    { simplified: '快', traditional: '快', pinyin: 'kuài', hanviet: 'khoái', vietnamese: 'Nhanh' },
    { simplified: '快乐', traditional: '快樂', pinyin: 'kuài lè', hanviet: 'khoái lạc', vietnamese: 'Vui vẻ' },
    { simplified: '老', traditional: '老', pinyin: 'lǎo', hanviet: 'lão', vietnamese: 'Già' },
    { simplified: '累', traditional: '累', pinyin: 'lèi', hanviet: 'lụy', vietnamese: 'Mệt' },
    { simplified: '礼貌', traditional: '禮貌', pinyin: 'lǐ mào', hanviet: 'lễ mạo', vietnamese: 'Lịch sự' },
    { simplified: '两', traditional: '兩', pinyin: 'liǎng', hanviet: 'lưỡng', vietnamese: 'Hai' },
    { simplified: '亮', traditional: '亮', pinyin: 'liàng', hanviet: 'lượng', vietnamese: 'Sáng' },
    { simplified: '路', traditional: '路', pinyin: 'lù', hanviet: 'lộ', vietnamese: 'Đường' },
    { simplified: '绿', traditional: '綠', pinyin: 'lǜ', hanviet: 'lục', vietnamese: 'Xanh lá' },
    { simplified: '妈妈', traditional: '媽媽', pinyin: 'mā ma', hanviet: 'ma ma', vietnamese: 'Mẹ' },
    { simplified: '马', traditional: '馬', pinyin: 'mǎ', hanviet: 'mã', vietnamese: 'Ngựa' },
    { simplified: '马上', traditional: '馬上', pinyin: 'mǎ shàng', hanviet: 'mã thượng', vietnamese: 'Ngay lập tức' },
    { simplified: '满意', traditional: '滿意', pinyin: 'mǎn yì', hanviet: 'mãn ý', vietnamese: 'Hài lòng' },
    { simplified: '妹妹', traditional: '妹妹', pinyin: 'mèi mei', hanviet: 'muội muội', vietnamese: 'Em gái' },
    { simplified: ' men', traditional: '門', pinyin: 'men', hanviet: 'môn', vietnamese: 'Cửa' },
    { simplified: '门', traditional: '門', pinyin: 'mén', hanviet: 'môn', vietnamese: 'Cửa' },
    { simplified: '面', traditional: '面', pinyin: 'miàn', hanviet: 'mịch', vietnamese: 'Mặt' },
    { simplified: '面条', traditional: '麵條', pinyin: 'miàn tiáo', hanviet: 'mịch điều', vietnamese: 'Mì sợi' },
    { simplified: '明白', traditional: '明白', pinyin: 'míng bai', hanviet: 'minh bạch', vietnamese: 'Hiểu rõ' },
    { simplified: '拿', traditional: '拿', pinyin: 'ná', hanviet: 'nã', vietnamese: 'Cầm, lấy' },
    { simplified: '奶', traditional: '奶奶', pinyin: 'nǎi nai', hanviet: 'nãi nãi', vietnamese: 'Bà nội' },
    { simplified: '难过', traditional: '難過', pinyin: 'nán guò', hanviet: 'nan quá', vietnamese: 'Buồn' },
    { simplified: '好吃', traditional: '好吃', pinyin: 'hǎo chī', hanviet: 'hảo xực', vietnamese: 'Ngon' },
    { simplified: '号', traditional: '號', pinyin: 'hào', hanviet: 'hiệu', vietnamese: 'Ngày, số' },
    { simplified: '黑', traditional: '黑', pinyin: 'hēi', hanviet: 'hắc', vietnamese: 'Đen' },
  ];

  return hskData;
}

// ── Download Functions ────────────────────────────────────────────────────
async function fetchURL(url: string): Promise<string | null> {
  try {
    info(`Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WenZi-Dictionary-Importer/1.0',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      warn(`HTTP ${response.status}: ${url}`);
      return null;
    }

    const content = await response.text();
    ok(`Downloaded ${(content.length / 1024).toFixed(1)} KB`);
    return content;
  } catch (e) {
    warn(`Failed: ${(e as Error).message}`);
    return null;
  }
}

async function downloadFromSource(source: typeof DATA_SOURCES.cedict): Promise<DictEntry[]> {
  info(`\nTrying: ${source.name}`);

  for (const url of source.urls) {
    const content = await fetchURL(url);
    if (!content) continue;

    try {
      if (source.parser === 'cedict') {
        return parseCEDICT(content);
      } else if (source.parser === 'hsk' || source.parser === 'json') {
        const data = JSON.parse(content);
        return parseJSONData(Array.isArray(data) ? data : [data]);
      }
    } catch (e) {
      warn(`Parse error: ${(e as Error).message}`);
    }
  }

  return [];
}

// ── Chunking ───────────────────────────────────────────────────────────────
function chunkData(entries: DictEntry[]): void {
  info(`\nChunking ${entries.length} entries...`);

  const letterBuckets: Map<string, DictEntry[]> = new Map();

  for (const entry of entries) {
    if (!entry.simplified || !entry.vietnamese) continue;

    const letter = getFirstLetter(entry.pinyin);
    if (!letterBuckets.has(letter)) {
      letterBuckets.set(letter, []);
    }
    letterBuckets.get(letter)!.push(entry);
  }

  // Sort and write chunks
  const sortedKeys = Array.from(letterBuckets.keys()).sort();
  let totalEntries = 0;

  const indexData: Record<string, { file: string; count: number }> = {};

  for (const key of sortedKeys) {
    const data = letterBuckets.get(key)!;
    // Sort entries
    data.sort((a, b) => {
      const pa = removeTones(a.pinyin);
      const pb = removeTones(b.pinyin);
      if (pa !== pb) return pa.localeCompare(pb);
      return a.simplified.localeCompare(b.simplified);
    });

    const filename = `${key}.json`;
    const filepath = join(OUTPUT_DIR, filename);

    // Remove duplicates by simplified+vietnamese
    const seen = new Set<string>();
    const unique = data.filter(e => {
      const k = `${e.simplified}|${e.vietnamese}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    writeFileSync(filepath, JSON.stringify(unique, null, 2), 'utf-8');
    totalEntries += unique.length;

    indexData[key] = { file: filename, count: unique.length };
  }

  // Write index
  const indexFile = join(OUTPUT_DIR, 'index.json');
  writeFileSync(indexFile, JSON.stringify({
    chunks: indexData,
    total: totalEntries,
    generatedAt: new Date().toISOString(),
  }, null, 2), 'utf-8');

  ok(`Created ${sortedKeys.length} chunks with ${totalEntries} entries`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('\n\x1b[1mWenZi — Dictionary Resource Downloader\x1b[0m\n');

  // Ensure directories exist
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(RAW_DATA_DIR, { recursive: true });

  let allEntries: DictEntry[] = [];

  // Try CC-CEDICT first
  const cedictEntries = await downloadFromSource(DATA_SOURCES.cedict);
  if (cedictEntries.length > 0) {
    allEntries.push(...cedictEntries);
    ok(`CC-CEDICT: ${cedictEntries.length} entries`);
  }

  // Try HSK vocabulary
  const hskEntries = await downloadFromSource(DATA_SOURCES.hsk);
  if (hskEntries.length > 0) {
    allEntries.push(...hskEntries);
    ok(`HSK: ${hskEntries.length} entries`);
  }

  // If no external data, use sample
  if (allEntries.length === 0) {
    warn('\nNo external data available, using sample data.');
    allEntries = generateSampleData();
    ok(`Sample data: ${allEntries.length} entries`);
  }

  // Save raw data for reference
  const rawFile = join(RAW_DATA_DIR, `raw_${Date.now()}.json`);
  writeFileSync(rawFile, JSON.stringify(allEntries.slice(0, 1000), null, 2), 'utf-8');
  info(`Saved preview: ${rawFile}`);

  // Chunk and save
  chunkData(allEntries);

  log('\n' + '─'.repeat(50));
  ok('Dictionary data ready!');
  info(`Output: ${OUTPUT_DIR}`);
  info(`Total entries: ${allEntries.length}`);
  log('');
}

main().catch(e => {
  err(`Error: ${e.message}`);
  process.exit(1);
});
