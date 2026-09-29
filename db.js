const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'crew.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,      -- navigation 驾驶 / marine 轮机 / radio 无线电
  type TEXT NOT NULL,          -- chart 海图 / collision 避碰 / listening 听力 / general 综合
  question TEXT NOT NULL,
  options TEXT NOT NULL,       -- JSON array
  answer INTEGER NOT NULL,     -- index
  explanation TEXT NOT NULL,
  exam_version TEXT NOT NULL,  -- 适用考试版本
  meta TEXT DEFAULT '{}',      -- JSON: 听力原文 / 海图SVG 等
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS answers (
  uuid TEXT PRIMARY KEY,
  user TEXT NOT NULL,
  question_id TEXT NOT NULL,
  chosen INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_answers_user ON answers(user);
`);

// ---------- 海图题 SVG（离线可渲染） ----------
const chartSvg1 = `<svg viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;background:#eaf3fb;border:1px solid #b8cfe0;border-radius:6px">
  <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c0392b"/></marker></defs>
  <path d="M0,150 Q80,120 160,140 T320,130 L320,210 L0,210 Z" fill="#cfe6f5"/>
  <path d="M0,150 Q80,120 160,140 T320,130" fill="none" stroke="#5b9bd5" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="40" y="60" font-size="13" fill="#2a5d8f" font-family="sans-serif">18</text>
  <text x="120" y="90" font-size="13" fill="#2a5d8f" font-family="sans-serif">22</text>
  <text x="210" y="70" font-size="13" fill="#2a5d8f" font-family="sans-serif">16</text>
  <text x="270" y="100" font-size="13" fill="#2a5d8f" font-family="sans-serif">9</text>
  <text x="60" y="175" font-size="11" fill="#5b7a99" font-family="sans-serif">泥</text>
  <text x="180" y="180" font-size="11" fill="#5b7a99" font-family="sans-serif">沙</text>
  <g transform="translate(250,150)">
    <circle r="7" fill="#fff" stroke="#333" stroke-width="1.5"/>
    <path d="M-4,0 L4,0 M0,-4 L0,4" stroke="#333" stroke-width="1.5"/>
  </g>
  <text x="238" y="175" font-size="10" fill="#333" font-family="sans-serif">灯塔(★)</text>
  <line x1="30" y1="30" x2="290" y2="30" stroke="#c0392b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="150" y="24" font-size="11" fill="#c0392b" font-family="sans-serif">计划航线 090°</text>
  <text x="10" y="205" font-size="10" fill="#666" font-family="sans-serif">比例尺 1:50000</text>
</svg>`;

const chartSvg2 = `<svg viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;background:#eaf3fb;border:1px solid #b8cfe0;border-radius:6px">
  <circle cx="160" cy="105" r="80" fill="none" stroke="#b8cfe0" stroke-width="1"/>
  <circle cx="160" cy="105" r="55" fill="none" stroke="#b8cfe0" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="160" cy="105" r="30" fill="#cfe6f5"/>
  <text x="152" y="100" font-size="12" fill="#2a5d8f" font-family="sans-serif">5</text>
  <text x="152" y="130" font-size="12" fill="#2a5d8f" font-family="sans-serif">8</text>
  <text x="152" y="160" font-size="12" fill="#2a5d8f" font-family="sans-serif">12</text>
  <g stroke="#333" stroke-width="1.5">
    <line x1="160" y1="105" x2="160" y2="35"/>
    <line x1="160" y1="105" x2="230" y2="105"/>
    <line x1="160" y1="105" x2="160" y2="175"/>
    <line x1="160" y1="105" x2="90" y2="105"/>
  </g>
  <text x="150" y="28" font-size="11" fill="#333" font-family="sans-serif">N</text>
  <text x="232" y="109" font-size="11" fill="#333" font-family="sans-serif">E</text>
  <text x="152" y="190" font-size="11" fill="#333" font-family="sans-serif">S</text>
  <text x="78" y="109" font-size="11" fill="#333" font-family="sans-serif">W</text>
  <path d="M160,105 L210,70" stroke="#c0392b" stroke-width="2" marker-end="url(#arr2)"/>
  <defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c0392b"/></marker></defs>
  <text x="212" y="66" font-size="11" fill="#c0392b" font-family="sans-serif">船位</text>
</svg>`;

const chartSvg3 = `<svg viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;background:#eaf3fb;border:1px solid #b8cfe0;border-radius:6px">
  <path d="M0,120 Q100,90 200,110 T320,100 L320,210 L0,210 Z" fill="#cfe6f5"/>
  <path d="M0,120 Q100,90 200,110 T320,100" fill="none" stroke="#5b9bd5" stroke-width="2"/>
  <text x="40" y="80" font-size="13" fill="#2a5d8f" font-family="sans-serif">30</text>
  <text x="130" y="70" font-size="13" fill="#2a5d8f" font-family="sans-serif">20</text>
  <text x="230" y="75" font-size="13" fill="#2a5d8f" font-family="sans-serif">10</text>
  <g transform="translate(100,160)"><path d="M0,-8 L6,6 L-6,6 Z" fill="#e67e22" stroke="#333" stroke-width="1"/><line x1="0" y1="6" x2="0" y2="14" stroke="#333"/></g>
  <text x="86" y="190" font-size="10" fill="#333" font-family="sans-serif">浮筒</text>
  <g transform="translate(220,160)"><circle r="6" fill="#e74c3c" stroke="#333" stroke-width="1"/></g>
  <text x="206" y="190" font-size="10" fill="#333" font-family="sans-serif">灯浮</text>
  <text x="10" y="205" font-size="10" fill="#666" font-family="sans-serif">比例尺 1:100000</text>
</svg>`;

const questions = [
  // ============ 船舶驾驶 - 海图题 ============
  { category: 'navigation', type: 'chart', question: '海图上水深注记数字"18"（如图），其含义是：',
    options: ['该处水深 18 米', '该处水深 18 英尺', '该处为 18 米等深线', '该处底质为岩礁，水深 18 拓'],
    answer: 0, explanation: '海图上水深数字表示深度，单位为米（m），注记位置即水深测量点位置。英版海图部分旧图用拓（fathom），我国海图均以米为单位。',
    exam_version: '16规则·海图作业', meta: { svg: chartSvg1 } },
  { category: 'navigation', type: 'chart', question: '图中灯塔符号（★）的主要作用是：',
    options: ['供船舶测定船位和避险', '标记渔场位置', '表示水下障碍物', '指示锚地边界'],
    answer: 0, explanation: '灯塔是重要的陆标定位物标，船舶可利用灯塔测定方位、距离确定船位，也可作为避险物标。',
    exam_version: '16规则·航海学', meta: { svg: chartSvg1 } },
  { category: 'navigation', type: 'chart', question: '海图比例尺为 1:50000，图上两点间距 2 厘米，实地距离为：',
    options: ['500 米', '1000 米', '10000 米', '5000 米'],
    answer: 1, explanation: '实地距离 = 图上距离 × 比例尺分母 = 2cm × 50000 = 100000cm = 1000m。比例尺分母越大，相同图上距离代表的实地距离越大。',
    exam_version: '11规则·航海学', meta: { svg: chartSvg1 } },
  { category: 'navigation', type: 'chart', question: '图中以船位为中心的虚线同心圆（如图），其用途是：',
    options: ['表示雷达距离圈，辅助估算物标距离', '表示等深线', '表示行政区划分界线', '表示海底电缆保护区'],
    answer: 0, explanation: '雷达屏幕上的距离圈（距标圈）用于快速估算物标距本船的距离，是雷达定位与避碰的重要参考。',
    exam_version: '16规则·航海仪器', meta: { svg: chartSvg2 } },
  { category: 'navigation', type: 'chart', question: '图中水深注记由 30→20→10 逐渐减小，表明船舶驶向：',
    options: ['浅水区，应注意搁浅危险', '深水区，可加速航行', '锚地，必须抛锚', '渔区，必须停航'],
    answer: 0, explanation: '水深逐渐变浅说明接近岸边或浅滩，船舶应注意搁浅危险，及时测深、修正航线，保留足够富余水深。',
    exam_version: '2022版大纲·航海学', meta: { svg: chartSvg3 } },

  // ============ 船舶驾驶 - 避碰题 ============
  { category: 'navigation', type: 'collision', question: '互见中，一艘机动船与一艘帆船（驶帆）相遇致有构成碰撞危险时，应：',
    options: ['机动船给帆船让路', '帆船给机动船让路', '两船各自向右转向', '两船互为让路船'],
    answer: 0, explanation: '《国际海上避碰规则》第18条规定：机动船应给帆船（除操纵能力受到限制的船舶外）让路。帆船通常享有更高的航路优先权。',
    exam_version: '16规则·避碰规则', meta: {} },
  { category: 'navigation', type: 'collision', question: '互见中，一船正从他船正横后大于 22.5° 的方向赶上他船（追越），则：',
    options: ['追越船应给被追越船让路', '被追越船应给追越船让路', '两船互为让路船', '追越船应鸣放一长声后直航'],
    answer: 0, explanation: '规则第13条：任何船舶在追越他船时，均应给被追越船让路。追越船的让路义务持续到驶过让清为止。',
    exam_version: '16规则·避碰规则', meta: {} },
  { category: 'navigation', type: 'collision', question: '夜间，船舶在垂直方向显示三盏环照红灯，表示该船为：',
    options: ['失控船', '操纵能力受到限制的船', '限于吃水的船', '搁浅船'],
    answer: 0, explanation: '规则第27条：失控船在夜间应显示垂直两盏环照红灯（对水移动时还应显示舷灯和尾灯）。注意三盏红灯为操纵能力受限船的部分号灯，需结合号型判断。',
    exam_version: '11规则·避碰规则', meta: {} },
  { category: 'navigation', type: 'collision', question: '两艘机动船在海上对遇（航向相反或接近相反）致有碰撞危险时，应：',
    options: ['各自向右转向，互从左舷会船', '各自向左转向，互从右舷会船', '保持航向航向，等待对方避让', '鸣放五短声后倒车'],
    answer: 0, explanation: '规则第14条：对遇局面中两船应各自向右转向，从而互以左舷通过。这是避免对遇碰撞的标准行动。',
    exam_version: '16规则·避碰规则', meta: {} },
  { category: 'navigation', type: 'collision', question: '能见度不良时，一船听到他船雾号显似在本船正横以前但位置尚未确定，应：',
    options: ['将航速减到能维持航向的最小速度，必要时把船停住', '立即向右转向 90°', '保持原航原航向，等待雾散', '鸣放一长声后加速通过'],
    answer: 0, explanation: '规则第19条：听到他船雾号显似在正横以前，应减速到能维持航向的最小速度，必要时停车；在确认无碰撞危险前应谨慎驾驶。',
    exam_version: '2022版大纲·避碰规则', meta: {} },

  // ============ 船舶驾驶 - 英语听力 ============
  { category: 'navigation', type: 'listening', question: '【听力】请听 VHF 通话，该通话使用的遇险/安全信号是：',
    options: ['Mayday（遇险）', 'Securité（安全）', 'Pan-Pan（紧急）', 'Security 呼叫'],
    answer: 0, explanation: '听力原文为 "Mayday, Mayday, Mayday"，是无线电话遇险信号，表示船舶受到严重和紧迫危险，需要立即援助。Securité 为安全信号，Pan-Pan 为紧急信号。',
    exam_version: '16规则·航海英语听力', meta: { script: 'Mayday, Mayday, Mayday. This is motor vessel Blue Star, Blue Star, Blue Star. I am in distress at position 31 degrees 15 minutes North, 122 degrees 40 minutes East. I require immediate assistance. Over.' } },
  { category: 'navigation', type: 'listening', question: '【听力】请听航行警告，警告内容主要涉及：',
    options: ['一片渔船密集区，注意避让', '一座新灯塔发光', '航道疏浚施工', '军事演习禁航区'],
    answer: 0, explanation: '原文报告 "large concentration of fishing vessels"（渔船密集），要求过往船舶谨慎驾驶、注意避让渔船。',
    exam_version: '2022版大纲·航海英语听力', meta: { script: 'Security, Security, Security. All ships approaching the fairway are advised: large concentration of fishing vessels reported in the vicinity of position 31 degrees 10 North, 122 degrees 30 East. Navigate with caution. Out.' } },

  // ============ 船舶驾驶 - 综合 ============
  { category: 'navigation', type: 'general', question: '船上磁罗经指示的航向与真航向之间的差值称为：',
    options: ['罗经差（磁差与自差的代数和）', '船位差', '方位差', '里程差'],
    answer: 0, explanation: '罗经差 = 磁差 + 自差。磁差因地而异、随时间变化；自差因船磁影响而变。航行中需经常测定罗经差并修正。',
    exam_version: '11规则·航海学', meta: {} },
  { category: 'navigation', type: 'general', question: '大潮（朔望潮）通常发生在：',
    options: ['农历初一和十五前后', '农历初八和二十三前后', '农历每天正午', '仅在夏至日'],
    answer: 0, explanation: '朔望日（初一、十五）太阳、月球、地球近似成一直线，引潮力最大，形成大潮；上弦、下弦（初八、廿三）形成小潮。',
    exam_version: '16规则·航海学', meta: {} },

  // ============ 轮机工程 - 综合 ============
  { category: 'marine', type: 'general', question: '柴油机运行中，若某缸排气温度明显升高且排气冒黑烟，最可能的原因是：',
    options: ['该缸喷油器雾化不良或喷油定时滞后', '滑油压力过高', '冷却水温度过低', '进气滤清器堵塞（全部缸同时）'],
    answer: 0, explanation: '单缸排温升高、冒黑烟多为该缸喷油器雾化不良、喷油定时过晚或后燃严重，导致燃烧恶化。应检查喷油器及喷油定时。',
    exam_version: '16规则·主推进动力装置', meta: {} },
  { category: 'marine', type: 'general', question: '柴油机曲轴主轴承磨损量的主要测量方法是：',
    options: ['测量轴承间隙（压铅法或塞尺法）并检查桥规值', '仅用目视检查', '测量排气温度', '化验滑油黏度'],
    answer: 0, explanation: '主轴承磨损通过桥规值、轴承间隙（压铅丝法）及圆度圆柱度测量来判断，磨损超限应更换或修刮轴承。',
    exam_version: '11规则·主推进动力装置', meta: {} },
  { category: 'marine', type: 'general', question: '船舶辅锅炉运行中，水位计内水位呆滞不动（看不到波动），可能是：',
    options: ['水位计汽连通管堵塞或形成"假水位"', '锅炉负荷过高', '给水温度过高', '燃烧减弱'],
    answer: 0, explanation: '水位计水位呆滞不动多为汽连通管堵塞或汽水共腾形成假水位，应立即冲洗水位计并查明原因，防止锅炉缺水或满水事故。',
    exam_version: '16规则·船舶辅机', meta: {} },
  { category: 'marine', type: 'general', question: '舵机操舵时，舵叶偏转速度过慢，最可能的原因是：',
    options: ['液压系统流量不足或系统内有空气', '舵叶面积过大', '电源频率过高', '舵角指示器故障'],
    answer: 0, explanation: '舵机转舵慢主要因液压泵排量不足、系统漏油或混入空气、溢流阀调定压力过低等，应检查液压系统并排气。',
    exam_version: '2022版大纲·船舶辅机', meta: {} },
  { category: 'marine', type: 'general', question: '船用柴油机润滑油在使用中黏度明显下降，主要原因是：',
    options: ['燃油稀释（混入柴油）或高温氧化', '水分蒸发', '添加剂增加', '滑油压力升高'],
    answer: 0, explanation: '滑油黏度下降常见原因为燃油混入稀释（喷油器漏油、怠速过长）、高温氧化裂解。黏度下降会破坏油膜，应及时化验并换油。',
    exam_version: '16规则·轮机维护与修理', meta: {} },

  // ============ 轮机工程 - 英语听力 ============
  { category: 'marine', type: 'listening', question: '【轮机英语听力】请听机舱通话，报告的故障是：',
    options: ['2号缸排气阀漏气，需停车检修', '1号缸进气滤器堵塞', '主机滑油压力正常', '3号缸冷却水温度过低'],
    answer: 0, explanation: '原文 "No. 2 cylinder exhaust valve leaking" 即2号缸排气阀漏气，会导致排温升高、功率下降，需停车检修排气阀。',
    exam_version: '16规则·轮机英语听力', meta: { script: 'Chief, No. 2 cylinder exhaust valve is leaking. Exhaust temperature is rising and black smoke from the funnel. We need to stop the engine and inspect the exhaust valve. Over.' } },
  { category: 'marine', type: 'listening', question: '【轮机英语听力】请听通话，对方要求：',
    options: ['立即启动备用发电机并并电', '停止所有泵浦', '打开海底门', '降速航行'],
    answer: 0, explanation: '原文要求 "start the standby generator and synchronize"，即启动备用发电机并同步并电，以应对用电负荷增加或主发电机故障。',
    exam_version: '2022版大纲·轮机英语听力', meta: { script: 'Engine room, bridge. We are maneuvering. Please start the standby generator and synchronize it immediately. Over.' } },

  // ============ 无线电通信 - 综合 ============
  { category: 'radio', type: 'general', question: 'GMDSS 中，用于自动发射遇险报警并能提供船位的卫星设备是：',
    options: ['EPIRB（应急无线电示位标）', 'SART（搜救雷达应答器）', 'VHF 无线电话', 'NAVTEX 接收机'],
    answer: 0, explanation: 'EPIRB 通过 COSPAS-SARSAT 卫星系统自动发送遇险报警及船位（406MHz），是 GMDSS 中最重要的遇险报警设备之一。',
    exam_version: '16规则·GMDSS', meta: {} },
  { category: 'radio', type: 'general', question: 'SART（搜救雷达应答器）在搜救中主要用于：',
    options: ['在雷达屏幕上显示 12 个亮点，指示救生艇/幸存者位置', '自动发送 Morse 电报', '接收气象传真图', '测定本船船位'],
    answer: 0, explanation: 'SART 被搜救雷达触发后，在雷达荧光屏上显示 12 个等距亮点，指示遇险幸存者或救生艇位置，便于搜救船舶接近。',
    exam_version: '11规则·GMDSS', meta: {} },
  { category: 'radio', type: 'general', question: 'VHF 无线电话遇险通信应使用的频道是：',
    options: ['16 频道（156.8MHz）', '70 频道', '13 频道', '88 频道'],
    answer: 0, explanation: 'VHF 16 频道（156.8MHz）是无线电话遇险与呼叫频道，用于遇险呼叫、值守和安全通信；DSC 遇险报警在 70 频道。',
    exam_version: '16规则·GMDSS', meta: {} },

  // ============ 无线电通信 - 英语听力 ============
  { category: 'radio', type: 'listening', question: '【无线电英语听力】请听 VHF 通话，这是一次：',
    options: ['DSC 遇险转发后的无线电话遇险通信', '常规商务通话', '引水员登轮通知', '气象警告广播'],
    answer: 0, explanation: '通话以 Mayday 开头并包含 MMSI 编号，是 DSC 遇险报警（70频道）之后在 16 频道进行的无线电话遇险通信。',
    exam_version: '16规则·GMDSS英语听力', meta: { script: 'Mayday, Mayday, Mayday. This is motor vessel Fortune, MMSI 412345678. We have collided with an unknown object and are taking water. Request immediate assistance. Position 30 degrees 50 North, 122 degrees 20 East. Over.' } },
  { category: 'radio', type: 'listening', question: '【无线电英语听力】请听通话，呼叫方的意图是：',
    options: ['请求医疗援助（Radio Medical）', '报告海盗袭击', '请求拖轮协助', '询问港口靠泊计划'],
    answer: 0, explanation: '原文请求 "medical advice"（医疗指导），属于 GMDSS 中无线电医疗通信，可通过海岸电台获得医生的远程医疗指导。',
    exam_version: '2022版大纲·GMDSS英语听力', meta: { script: 'Pan-Pan, Pan-Pan, Pan-Pan. This is motor vessel Happy Star, MMSI 412999888. We have a crew member seriously injured in an engine room accident. Request medical advice and assistance. Over.' } },
];

const insert = db.prepare(`INSERT OR REPLACE INTO questions
  (id, category, type, question, options, answer, explanation, exam_version, meta, updated_at)
  VALUES (@id, @category, @type, @question, @options, @answer, @explanation, @exam_version, @meta, @updated_at)`);

const now = Date.now();
questions.forEach((q, i) => {
  insert.run({
    id: q.category + '-' + q.type + '-' + (i + 1).toString().padStart(3, '0'),
    category: q.category,
    type: q.type,
    question: q.question,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    exam_version: q.exam_version,
    meta: JSON.stringify(q.meta || {}),
    updated_at: now,
  });
});

module.exports = db;
