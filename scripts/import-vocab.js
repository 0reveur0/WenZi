#!/usr/bin/env node
/**
 * WenZi — Vocabulary Import Script
 * ──────────────────────────────────
 * Tải CC-CEDICT (CC BY-SA 3.0), parse, sinh Hán Việt từ bảng ký tự,
 * rồi băm thành các file JSON theo chữ cái đầu pinyin.
 *
 * Dùng: node scripts/import-vocab.js [--max 30000] [--out public/data/chunks]
 *
 * Nguồn dữ liệu: CC-CEDICT — https://cc-cedict.org
 */

import https from 'node:https';
import http  from 'node:http';
import zlib  from 'node:zlib';
import fs    from 'node:fs';
import path  from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, '.dict-cache');

// ── CLI args ──────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const getArg  = (flag, def) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i+1] : def; };
const MAX     = parseInt(getArg('--max', '30000'));
const OUT_DIR = path.resolve(ROOT, getArg('--out', 'public/data/chunks'));

// ── Terminal colors ───────────────────────────────────────────────────────
const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m',
  yellow:'\x1b[33m', cyan:'\x1b[36m', red:'\x1b[31m', gray:'\x1b[90m',
};
const log  = m => process.stdout.write(m + '\n');
const ok   = m => log(`${C.green}✓${C.reset} ${m}`);
const info = m => log(`${C.cyan}ℹ${C.reset} ${m}`);
const warn = m => log(`${C.yellow}⚠${C.reset} ${m}`);
const err  = m => log(`${C.red}✗${C.reset} ${m}`);
const step = (n,t,m) => log(`${C.bold}[${n}/${t}]${C.reset} ${m}`);
const prog = (n,t) => {
  const pct = Math.round(n/t*100);
  const bar = '█'.repeat(Math.round(pct/5)) + '░'.repeat(20-Math.round(pct/5));
  process.stdout.write(`\r  ${bar} ${pct}% (${n.toLocaleString()}/${t.toLocaleString()})`);
};

// ── CC-CEDICT download URLs (thử theo thứ tự) ─────────────────────────────
const CEDICT_URLS = [
  // Plain UTF-8 text (no decompression needed)
  'https://raw.githubusercontent.com/nieldlr/zh-cedict/master/data/cedict_ts.u8',
  'https://raw.githubusercontent.com/mattbierner/cedict/master/cedict_ts.u8',
  // Gzip từ MDBG (nguồn chính thức)
  'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
];

// ── Download helper ───────────────────────────────────────────────────────
function fetchBuffer(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': 'WenZi-Dict-Importer/1.0 (github.com/wenzi)' },
      timeout: 60000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return fetchBuffer(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      let bytes = 0;
      res.on('data', c => { chunks.push(c); bytes += c.length; });
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadText(url) {
  const buf = await fetchBuffer(url);
  const isGzip = buf[0] === 0x1f && buf[1] === 0x8b;
  if (isGzip) {
    return new Promise((res, rej) => zlib.gunzip(buf, (e, r) => e ? rej(e) : res(r.toString('utf-8'))));
  }
  return buf.toString('utf-8');
}

async function downloadCedict() {
  // Kiểm tra cache
  const cacheFile = path.join(CACHE_DIR, 'cedict.txt');
  if (fs.existsSync(cacheFile)) {
    const age = (Date.now() - fs.statSync(cacheFile).mtimeMs) / 86400000;
    if (age < 30) {
      info(`Dùng cache (${age.toFixed(1)} ngày tuổi): ${cacheFile}`);
      return fs.readFileSync(cacheFile, 'utf-8');
    }
    warn(`Cache quá hạn (${age.toFixed(1)} ngày), tải lại...`);
  }

  let text = null;
  for (const url of CEDICT_URLS) {
    try {
      info(`Đang tải từ: ${url}`);
      text = await downloadText(url);
      ok(`Tải thành công — ${(Buffer.byteLength(text,'utf8')/1024/1024).toFixed(1)} MB`);
      break;
    } catch (e) {
      warn(`Thất bại (${e.message}), thử URL khác...`);
    }
  }

  if (!text) throw new Error('Không thể tải CC-CEDICT từ bất kỳ nguồn nào.');

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, text, 'utf-8');
  info(`Đã lưu cache → ${cacheFile}`);
  return text;
}

// ── Pinyin tone number → tone mark ────────────────────────────────────────
const TONE_TABLE = {
  a: ['ā','á','ǎ','à','a'], e: ['ē','é','ě','è','e'],
  i: ['ī','í','ǐ','ì','i'], o: ['ō','ó','ǒ','ò','o'],
  u: ['ū','ú','ǔ','ù','u'], ü: ['ǖ','ǘ','ǚ','ǜ','ü'],
};

function addTone(vowel, tone) {
  return TONE_TABLE[vowel]?.[tone - 1] ?? vowel;
}

function convertPinyin(raw) {
  // CC-CEDICT: "hao3 chun1" → "hǎo chūn"
  return raw.split(' ').map(syl => {
    const m = syl.match(/^([a-züA-ZÜ]*)([1-5])$/);
    if (!m) return syl.toLowerCase();
    const [, body, toneNum] = m;
    const tone = parseInt(toneNum);
    let s = body.toLowerCase().replace('u:', 'ü').replace('v', 'ü');

    // Tone placement rules (CC-CEDICT standard)
    const order = ['a','e','ou','u','i','ü','o'];
    for (const seq of order) {
      const idx = s.indexOf(seq);
      if (idx >= 0) {
        const vowel = s[idx];
        return s.slice(0, idx) + addTone(vowel, tone) + s.slice(idx + 1);
      }
    }
    return s;
  }).join(' ');
}

// ── Hán Việt character lookup table ──────────────────────────────────────
// Bảng tra ký tự → âm Hán Việt (dựa trên Unihan kVietnamese + từ điển HV chuẩn)
const HV = {
  // Số đếm & đơn vị
  '一':'nhất','二':'nhị','三':'tam','四':'tứ','五':'ngũ','六':'lục','七':'thất',
  '八':'bát','九':'cửu','十':'thập','百':'bách','千':'thiên','万':'vạn','亿':'ức',
  '零':'linh','半':'bán','第':'đệ','多':'đa','少':'thiểu','几':'kỷ',
  // Đại từ & hư từ
  '我':'ngã','你':'nhĩ','他':'tha','她':'tha','它':'tha','我们':'ngã môn',
  '你们':'nhĩ môn','他们':'tha môn','这':'giá','那':'na','什':'thập','么':'ma',
  '的':'đích','了':'liễu','是':'thị','在':'tại','有':'hữu','不':'bất','没':'một',
  '也':'dã','都':'đô','就':'tựu','还':'hoàn','再':'tái','很':'ngận','太':'thái',
  '真':'chân','非':'phi','很':'ngận','比':'tỷ','最':'tối','更':'canh',
  '以':'dĩ','之':'chi','于':'vu','与':'dữ','而':'nhi','为':'vi','因':'nhân',
  '所':'sở','如':'như','若':'nhược','则':'tắc','虽':'tuy','但':'đãn','和':'hòa',
  '或':'hoặc','及':'cập','对':'đối','从':'tùng','到':'đáo','向':'hướng',
  // Phương hướng & vị trí
  '东':'đông','西':'tây','南':'nam','北':'bắc','中':'trung','左':'tả','右':'hữu',
  '上':'thượng','下':'hạ','前':'tiền','后':'hậu','内':'nội','外':'ngoại',
  '里':'lý','旁':'bàng','间':'gian','边':'biên','方':'phương','面':'diện',
  // Con người & gia đình
  '人':'nhân','女':'nữ','男':'nam','子':'tử','父':'phụ','母':'mẫu',
  '兄':'huynh','弟':'đệ','姐':'tỷ','妹':'muội','儿':'nhi','孩':'hài',
  '夫':'phu','妻':'thê','家':'gia','祖':'tổ','父亲':'phụ thân',
  '孙':'tôn','婆':'bà','翁':'ông','民':'dân','众':'chúng','族':'tộc',
  '主':'chủ','君':'quân','王':'vương','帝':'đế','皇':'hoàng','臣':'thần',
  // Thời gian
  '日':'nhật','月':'nguyệt','年':'niên','时':'thời','分':'phân','秒':'miểu',
  '天':'thiên','今':'kim','昨':'tạc','明':'minh','早':'tảo','晚':'vãn',
  '春':'xuân','夏':'hạ','秋':'thu','冬':'đông','古':'cổ','史':'sử',
  '代':'đại','期':'kỳ','间':'gian','刻':'khắc','久':'cửu','常':'thường',
  // Tự nhiên
  '水':'thủy','火':'hỏa','木':'mộc','金':'kim','土':'thổ','山':'sơn',
  '川':'xuyên','河':'hà','海':'hải','湖':'hồ','风':'phong','云':'vân',
  '雨':'vũ','雪':'tuyết','雷':'lôi','电':'điện','光':'quang','日':'nhật',
  '月':'nguyệt','星':'tinh','天':'thiên','地':'địa','石':'thạch','草':'thảo',
  '花':'hoa','树':'thụ','林':'lâm','森':'sâm','田':'điền','土':'thổ',
  '泥':'nê','沙':'sa','岩':'nham','洋':'dương','岛':'đảo','洲':'châu',
  '原':'nguyên','野':'dã','荒':'hoang','溪':'khê','江':'giang','泉':'tuyền',
  // Động thực vật
  '马':'mã','牛':'ngưu','羊':'dương','猪':'trư','狗':'cẩu','猫':'miêu',
  '鸡':'kê','鸟':'điểu','鱼':'ngư','龙':'long','虎':'hổ','兔':'thỏ',
  '蛇':'xà','鼠':'thử','猴':'hầu','猪':'trư','象':'tượng','狮':'sư',
  '熊':'hùng','鹿':'lộc','狐':'hồ','狼':'lang','鹰':'ưng','鸭':'áp',
  '花':'hoa','草':'thảo','木':'mộc','竹':'trúc','松':'tùng','梅':'mai',
  '兰':'lan','菊':'cúc','荷':'hà','桃':'đào','柳':'liễu','桂':'quế',
  // Cơ thể người
  '头':'đầu','脸':'kiểm','眼':'nhãn','耳':'nhĩ','鼻':'tỷ','口':'khẩu',
  '齿':'xỉ','舌':'thiệt','手':'thủ','指':'chỉ','臂':'tý','脚':'cước',
  '腿':'thối','身':'thân','心':'tâm','肺':'phế','肝':'can','胃':'vị',
  '骨':'cốt','血':'huyết','肉':'nhục','皮':'bì','发':'phát',
  // Nhà cửa & đồ vật
  '门':'môn','窗':'song','房':'phòng','室':'thất','宫':'cung','殿':'điện',
  '庙':'miếu','寺':'tự','塔':'tháp','城':'thành','墙':'tường','桥':'kiều',
  '路':'lộ','道':'đạo','街':'nhai','楼':'lâu','台':'đài','站':'trạm',
  '场':'tràng','院':'viện','园':'viên','市':'thị','村':'thôn','乡':'hương',
  '书':'thư','笔':'bút','纸':'chỉ','刀':'đao','剑':'kiếm','弓':'cung',
  '箭':'tiễn','旗':'kỳ','印':'ấn','钱':'tiền','宝':'bảo','玉':'ngọc',
  '衣':'y','服':'phục','鞋':'hài','帽':'mạo','带':'đới','环':'hoàn',
  '碗':'oản','盘':'bàn','杯':'bôi','壶':'hồ','锅':'oa','灯':'đăng',
  '车':'xa','船':'thuyền','飞':'phi','机':'cơ','马':'mã',
  // Giáo dục & văn học
  '学':'học','校':'hiệu','师':'sư','生':'sinh','文':'văn','字':'tự',
  '书':'thư','读':'độc','写':'tả','语':'ngữ','言':'ngôn','词':'từ',
  '诗':'thi','歌':'ca','乐':'nhạc','艺':'nghệ','术':'thuật','画':'họa',
  '知':'tri','识':'thức','教':'giáo','训':'huấn','习':'tập','练':'luyện',
  '考':'khảo','试':'thí','答':'đáp','问':'vấn','题':'đề',
  // Số, toán & khoa học
  '数':'số','理':'lý','科':'khoa','技':'kỹ','法':'pháp','算':'toán',
  '量':'lượng','度':'độ','重':'trọng','力':'lực','速':'tốc','能':'năng',
  '热':'nhiệt','冷':'lãnh','压':'áp','声':'thanh','光':'quang',
  // Chính trị & xã hội
  '国':'quốc','政':'chính','党':'đảng','军':'quân','法':'pháp','律':'luật',
  '权':'quyền','利':'lợi','义':'nghĩa','理':'lý','制':'chế','度':'độ',
  '社':'xã','会':'hội','公':'công','私':'tư','民':'dân','官':'quan',
  '史':'sử','代':'đại','朝':'triều','帝':'đế','皇':'hoàng','将':'tướng',
  '战':'chiến','兵':'binh','阵':'trận','攻':'công','守':'thủ','胜':'thắng',
  // Kinh tế & thương mại
  '工':'công','商':'thương','业':'nghiệp','农':'nông','市':'thị','场':'tràng',
  '价':'giá','值':'trị','财':'tài','富':'phú','贫':'bần','穷':'cùng',
  '买':'mãi','卖':'mại','用':'dụng','费':'phí','产':'sản','品':'phẩm',
  // Màu sắc
  '红':'hồng','绿':'lục','蓝':'lam','黄':'hoàng','白':'bạch','黑':'hắc',
  '紫':'tử','橙':'cam','青':'thanh','灰':'hôi','金':'kim','银':'ngân',
  // Tính từ thường gặp
  '好':'hảo','坏':'hoại','大':'đại','小':'tiểu','高':'cao','低':'đê',
  '长':'trường','短':'đoản','宽':'khoan','窄':'trách','厚':'hậu','薄':'bạc',
  '快':'khoái','慢':'mạn','新':'tân','旧':'cựu','老':'lão','少':'thiểu',
  '热':'nhiệt','冷':'lãnh','强':'cường','弱':'nhược','美':'mỹ','丑':'xú',
  '富':'phú','贫':'bần','明':'minh','暗':'ám','软':'nhuyễn','硬':'ngạnh',
  '轻':'khinh','重':'trọng','远':'viễn','近':'cận','早':'tảo','晚':'vãn',
  '直':'trực','曲':'khúc','平':'bình','斜':'tà','圆':'viên','方':'phương',
  '真':'chân','假':'giả','实':'thực','虚':'hư','善':'thiện','恶':'ác',
  '贵':'quý','贱':'tiện','勇':'dũng','怯':'khiếp','忠':'trung','奸':'gian',
  // Động từ thường gặp
  '是':'thị','有':'hữu','做':'tố','走':'tẩu','来':'lai','去':'khứ',
  '看':'khán','听':'thính','说':'thuyết','想':'tưởng','知':'tri','爱':'ái',
  '恨':'hận','笑':'tiếu','哭':'khốc','打':'đả','拿':'nã','放':'phóng',
  '开':'khai','关':'quan','进':'tiến','出':'xuất','上':'thượng','下':'hạ',
  '起':'khởi','坐':'tọa','站':'trạm','跑':'bôn','飞':'phi','游':'du',
  '吃':'ngật','喝':'hát','睡':'thụy','醒':'tỉnh','死':'tử','生':'sinh',
  '买':'mãi','卖':'mại','送':'tống','取':'thủ','给':'cấp','用':'dụng',
  '学':'học','教':'giáo','读':'độc','写':'tả','画':'họa','唱':'xướng',
  '跳':'khiêu','玩':'ngoạn','工':'công','作':'tác','行':'hành','停':'đình',
  '找':'trảo','问':'vấn','答':'đáp','叫':'khiếu','告':'cáo','说':'thuyết',
  '带':'đới','送':'tống','帮':'bang','救':'cứu','杀':'sát','打':'đả',
  '建':'kiến','造':'tạo','破':'phá','变':'biến','增':'tăng','减':'giảm',
  // Các ký tự phổ biến khác
  '心':'tâm','意':'ý','情':'tình','感':'cảm','思':'tư','念':'niệm',
  '志':'chí','性':'tính','命':'mệnh','运':'vận','缘':'duyên','福':'phúc',
  '祸':'họa','善':'thiện','德':'đức','仁':'nhân','礼':'lễ','智':'trí',
  '信':'tín','义':'nghĩa','忠':'trung','孝':'hiếu','恭':'cung','廉':'liêm',
  '勤':'cần','俭':'kiệm','诚':'thành','勇':'dũng','静':'tĩnh','动':'động',
  '同':'đồng','异':'dị','通':'thông','断':'đoạn','合':'hợp','分':'phân',
  '全':'toàn','部':'bộ','半':'bán','段':'đoạn','节':'tiết','点':'điểm',
  '线':'tuyến','面':'diện','体':'thể','形':'hình','状':'trạng','样':'dạng',
  '种':'chủng','类':'loại','品':'phẩm','级':'cấp','次':'thứ','号':'hiệu',
  '名':'danh','字':'tự','姓':'tính','号':'hiệu','题':'đề','目':'mục',
  '里':'lý','公':'công','里':'lý','克':'khắc','斤':'cân','两':'lạng',
  '度':'độ','角':'giác','圆':'viên','球':'cầu','线':'tuyến','点':'điểm',
  '地':'địa','图':'đồ','界':'giới','区':'khu','域':'vực','洲':'châu',
  '国':'quốc','省':'tỉnh','市':'thị','县':'huyện','镇':'trấn','村':'thôn',
  '厂':'xưởng','店':'điếm','馆':'quán','楼':'lâu','院':'viện','所':'sở',
  '处':'xứ','部':'bộ','局':'cục','司':'ty','院':'viện','委':'ủy',
  '长':'trưởng','员':'viên','长':'trưởng','主':'chủ','副':'phó','总':'tổng',
  '会':'hội','议':'nghị','论':'luận','说':'thuyết','书':'thư','报':'báo',
  '纸':'chỉ','信':'tín','电':'điện','话':'thoại','网':'mạng','联':'liên',
  '通':'thông','讯':'tấn','播':'bá','视':'thị','听':'thính','观':'quan',
  '看':'khán','览':'lãm','读':'độc','阅':'duyệt','写':'tả','著':'trước',
  '印':'ấn','刷':'thứ','版':'bản','编':'biên','辑':'tập',
  '先':'tiên','后':'hậu','次':'thứ','再':'tái','又':'hựu','另':'linh',
  '共':'cộng','各':'các','自':'tự','相':'tương','互':'hỗ','对':'đối',
};

function getHanviet(simplified) {
  const chars = [...simplified]; // Handle multi-byte chars properly
  const parts = chars.map(c => HV[c] || '');
  const result = parts.filter(Boolean).join(' ');
  return result;
}

// ── Parse CC-CEDICT ───────────────────────────────────────────────────────
function removeTones(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ǖǘǚǜ]/g,'u').toLowerCase().trim();
}

function getFirstLetter(pinyin) {
  const plain = removeTones(pinyin);
  const first = plain.charAt(0).toLowerCase();
  return (first >= 'a' && first <= 'z') ? first : 'misc';
}

function parseCedict(text) {
  // QUAN TRỌNG: Phải đọc TẤT CẢ entries trước, vì CC-CEDICT sắp xếp theo
  // Unicode của ký tự Truyền thống (không phải pinyin), nên nếu dừng sớm
  // sẽ bỏ sót các từ thông dụng có Unicode cao (我, 爱, 谢, v.v.)
  const allEntries = [];
  const lines = text.split('\n');

  info(`Đọc toàn bộ ${lines.length.toLocaleString()} dòng (quét đầy đủ)...`);

  let linesDone = 0;
  let skipped = 0;

  for (const line of lines) {
    linesDone++;
    if (line.startsWith('#') || !line.trim()) continue;

    // Format: Traditional Simplified [pin1 yin1] /def1/def2/
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
    if (!m) { skipped++; continue; }

    const [, traditional, simplified, pinyinRaw, defStr] = m;

    // Bỏ qua nếu không có ký tự Hán
    if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(simplified)) { skipped++; continue; }

    const defs = defStr.split('/').map(d => d.trim()).filter(d => d.length > 0);
    if (defs.length === 0) { skipped++; continue; }

    // Bỏ qua biến thể, từ cổ, từ viết tắt
    const firstDef = defs[0].toLowerCase();
    if (firstDef.startsWith('variant of') || firstDef.startsWith('old variant') ||
        firstDef.startsWith('see ') || firstDef.startsWith('abbr. for') ||
        firstDef.startsWith('old name') || firstDef.startsWith('used in')) {
      skipped++; continue;
    }

    const pinyin = convertPinyin(pinyinRaw);
    const hanviet = getHanviet(simplified);
    const vietnamese = defs.slice(0, 2).join('; ').slice(0, 120);

    allEntries.push({ simplified, traditional, pinyin, hanviet, vietnamese });

    if (linesDone % 20000 === 0) {
      process.stdout.write(`\r  Đã đọc ${linesDone.toLocaleString()} dòng — ${allEntries.length.toLocaleString()} entries hợp lệ...`);
    }
  }
  process.stdout.write('\n');

  ok(`Đọc xong: ${allEntries.length.toLocaleString()} entries, bỏ qua: ${skipped.toLocaleString()}`);

  // Nếu vượt quá MAX, ưu tiên giữ từ ngắn (1-2 ký tự) rồi từ dài hơn
  if (allEntries.length <= MAX) return allEntries;

  warn(`Giới hạn ${MAX.toLocaleString()} — ưu tiên từ ngắn và thông dụng...`);

  // Nhóm theo độ dài của simplified
  const short   = allEntries.filter(e => e.simplified.length <= 2);
  const medium  = allEntries.filter(e => e.simplified.length === 3);
  const longer  = allEntries.filter(e => e.simplified.length >= 4);

  const result = [];
  result.push(...short);   // Giữ tất cả từ 1-2 ký tự
  if (result.length < MAX) result.push(...medium.slice(0, MAX - result.length));
  if (result.length < MAX) result.push(...longer.slice(0, MAX - result.length));

  ok(`Đã chọn: ${result.length.toLocaleString()} entries (ưu tiên từ ngắn)`);
  return result;
}

// ── Chunk và ghi file ─────────────────────────────────────────────────────
function writeChunks(entries) {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const buckets = new Map();

  for (const entry of entries) {
    const letter = getFirstLetter(entry.pinyin);
    if (!buckets.has(letter)) buckets.set(letter, []);
    buckets.get(letter).push(entry);
  }

  const sortedKeys = [...buckets.keys()].sort();
  const indexData = {};
  let total = 0;

  for (const key of sortedKeys) {
    const bucket = buckets.get(key);

    // Sắp xếp theo pinyin rồi simplified
    bucket.sort((a, b) => {
      const pa = removeTones(a.pinyin);
      const pb = removeTones(b.pinyin);
      if (pa !== pb) return pa.localeCompare(pb);
      return a.simplified.localeCompare(b.simplified);
    });

    const filename = `${key}.json`;
    const filepath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(bucket, null, 2), 'utf-8');

    const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
    log(`  ${C.gray}${filename.padEnd(10)}${C.reset} ${bucket.length.toString().padStart(5)} entries  (${sizeKB} KB)`);

    indexData[key] = { file: filename, count: bucket.length };
    total += bucket.length;
  }

  // Ghi index
  const indexPath = path.join(OUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    chunks: indexData,
    total,
    generatedAt: new Date().toISOString(),
  }, null, 2), 'utf-8');

  return { keys: sortedKeys.length, total };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  log(`\n${C.bold}WenZi — Vocabulary Importer${C.reset}`);
  log(`${'─'.repeat(50)}`);
  log(`  Giới hạn: ${MAX.toLocaleString()} entries`);
  log(`  Output:   ${OUT_DIR}\n`);

  // Bước 1: Tải CC-CEDICT
  step(1, 3, 'Tải dữ liệu CC-CEDICT...');
  const text = await downloadCedict();

  // Bước 2: Parse
  step(2, 3, 'Parse và xử lý dữ liệu...');
  const entries = parseCedict(text);

  // Bước 3: Ghi chunks
  step(3, 3, `Ghi ${entries.length.toLocaleString()} entries vào chunks...`);
  const { keys, total } = writeChunks(entries);

  log(`\n${'─'.repeat(50)}`);
  ok(`Hoàn tất! ${total.toLocaleString()} từ trong ${keys} chunk files`);
  ok(`Thư mục: ${OUT_DIR}`);
  log(`\n${C.cyan}Chạy lệnh sau để reload từ điển:${C.reset}`);
  log(`  bun run dev  (hoặc restart server)\n`);
}

main().catch(e => {
  err(`Lỗi: ${e.message}`);
  process.exit(1);
});
