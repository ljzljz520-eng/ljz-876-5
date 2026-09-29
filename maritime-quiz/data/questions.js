/**
 * 题库
 * category: deck 驾驶 | engine 轮机 | radio 无线电
 * type:     chart 海图题 | colreg 避碰题 | listening 英语听力 | knowledge 专业知识
 * media:    可选，海图题 {kind:'svg', svg}；听力题 {kind:'speech', text, lang}
 * versions: 解析适用的考试版本 id（见 data/versions.js）
 */
module.exports = [
  // ============ 驾驶 · 海图题 ============
  {
    id: 'CH01',
    category: 'deck',
    type: 'chart',
    title: '墨卡托海图特性',
    stem: '关于墨卡托投影（等角正圆柱投影）海图的特性，下列说法正确的是：',
    options: [
      '纬度渐长，子午线为向极收敛的曲线',
      '等角航线在图上为直线，纬度越高相同纬差对应的图上距离越大',
      '大圆弧在图上为直线，图上长度与实地距离处处成固定比例',
      '高纬度海区变形最小，适合绘制极区海图',
    ],
    answer: 1,
    explanation:
      '墨卡托投影具有等角特性，恒向线（等角航线 rhumb line）表现为直线；其经线相互平行，为保持等角，纬线间隔随纬度升高而放大（纬度渐长率），故高纬变形显著，不能用于极区。大圆航线在墨卡托图上为凸向近极的曲线。',
    versions: ['chart-2022', 'syllabus-2022'],
  },
  {
    id: 'CH02',
    category: 'deck',
    type: 'chart',
    title: '识别海图图式（灯塔）',
    stem: '根据所附海图图式，图中星形符号旁标注 "Fl(3) 10s 25m 12M"，该物标是：',
    media: {
      kind: 'svg',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" role="img" aria-label="海图图式示例">
  <rect width="360" height="200" fill="#f4ecd8"/>
  <path d="M0 150 Q90 120 180 140 T360 130 V200 H0 Z" fill="#cfe0ee"/>
  <path d="M0 165 Q120 145 200 160 T360 155 V200 H0 Z" fill="#a9c7df"/>
  <g stroke="#7a5c2e" stroke-width="1.2" fill="none" opacity="0.7">
    <path d="M20 60 L340 60 M20 95 L340 95 M60 20 L60 185 M150 20 L150 185 M240 20 L240 185 M320 20 L320 185"/>
  </g>
  <g transform="translate(96,92)">
    <path d="M0 0 L10 -22 L20 0 Z" fill="#222"/>
    <circle cx="10" cy="-24" r="3" fill="#c0392b"/>
    <path d="M10 -24 L10 -34 M10 -24 L2 -31 M10 -24 L18 -31" stroke="#222" stroke-width="1.4"/>
  </g>
  <text x="124" y="86" font-family="serif" font-size="13" fill="#1a1a1a">Fl(3) 10s 25m 12M</text>
  <text x="124" y="104" font-family="serif" font-size="11" fill="#555">北角灯塔</text>
  <text x="250" y="120" font-family="serif" font-size="13" fill="#1a4d80">23₅ S</text>
  <circle cx="270" cy="150" r="3" fill="#1a4d80"/>
  <text x="18" y="188" font-family="sans-serif" font-size="9" fill="#666">示意海图（非航行用图）</text>
</svg>`,
    },
    options: [
      '定光灯桩，射程 3 海里',
      '闪光灯，每 10 秒闪 3 次，灯高 25 米，射程 12 海里的灯塔',
      '互光灯，每周期 3 秒，灯高 12 米，射程 25 海里',
      '莫尔斯灯光信号，信号组为 "10"',
    ],
    answer: 1,
    explanation:
      'Fl(3) 10s = flashing，一个周期 10 秒内闪 3 次；25m 为灯高（平均大潮高潮面至灯光中心），12M 为额定光力射程。这是灯塔灯质的标准图式注记。',
    versions: ['chart-2022', 'syllabus-2022'],
  },
  {
    id: 'CH03',
    category: 'deck',
    type: 'chart',
    title: '水深与底质注记',
    stem: '中版海图上某地注记为 "23₅ S"，其含义是：',
    options: [
      '水深 23.5 拓，底质为石头（Stone）',
      '水深 23.5 米，底质为沙（Sand）',
      '高程 23.5 米，底质为淤泥',
      '水深 23 米、浪高 5 米，底质为贝壳',
    ],
    answer: 1,
    explanation:
      '中版海图水深以米为单位，斜体数字表示深度不准或采自小比例尺资料；下标数字为小数位，23₅ = 23.5 m。底质缩写 S = Sand（沙），M = Mud（泥），Rk = Rock（岩），Sh = Shell（贝）。',
    versions: ['chart-2022', 'syllabus-2022'],
  },
  {
    id: 'CH04',
    category: 'deck',
    type: 'chart',
    title: '中版海图高程基准',
    stem: '中版海图上灯塔、山峰等高程的起算面通常采用：',
    options: [
      '平均海面',
      '理论最低潮面（理论深度基准面）',
      '1985 国家高程基准面（平均海面体系）',
      '当地最低天文潮面',
    ],
    answer: 2,
    explanation:
      '中版海图的干出高度、灯高、山高等高程注记采用 1985 国家高程基准（即黄海平均海面体系，旧图曾用1956黄海平均海水面）；而水深与干出滩则以理论最低潮面（理论深度基准面）起算，二者不可混淆。',
    versions: ['chart-2022'],
  },
  {
    id: 'CH05',
    category: 'deck',
    type: 'chart',
    title: '海图分类与图幅',
    stem: '沿岸航行进行海图作业时，通常优先使用的海图是：',
    options: ['总图（大洋图）', '航行图（沿岸图）', '港湾图', '远洋图'],
    answer: 1,
    explanation:
      '海图按用途和比例尺分为总图（小比例尺，研究大洋航线）、航行图（含远洋、近海、沿岸航行图）和港湾图（大比例尺，进出港及锚泊用）。沿岸航行应选用比例尺适当、资料最新的沿岸航行图，并注意及时登记航海通告、进行小改正。',
    versions: ['chart-2022', 'syllabus-2022', 'syllabus-2017'],
  },

  // ============ 驾驶 · 避碰题 ============
  {
    id: 'CO01',
    category: 'deck',
    type: 'colreg',
    title: '追越条款',
    stem: '《避碰规则》规定，一船从他船正横后大于 22.5° 的方向赶上他船时，下列做法正确的是：',
    options: [
      '被追越船应给追越船让路',
      '追越船应给被追越船让路，直到驶过让清为止',
      '两船互为让路船，同时向右转向',
      '夜间只能看到他船尾灯即不构成追越',
    ],
    answer: 1,
    explanation:
      '规则第十三条：追越船应给被追越船让路，且在随后两船方位变化到任何程度时，始终免除其让路责任，直至驶过让清。判定标准之一是夜间只能看到被追越船尾灯而看不到其任一舷灯（正横后大于22.5°）。',
    versions: ['colreg-2001', 'syllabus-2022', 'syllabus-2017'],
  },
  {
    id: 'CO02',
    category: 'deck',
    type: 'colreg',
    title: '交叉相遇局面',
    stem: '两艘机动船交叉相遇致有构成碰撞危险，有他船在本船右舷者应：',
    options: [
      '保向保速，由右舷船采取行动',
      '给他船让路，如环境许可还应避免横越他船前方',
      '立即向左转向，从他船船尾通过',
      '鸣放五短声并减速停车',
    ],
    answer: 1,
    explanation:
      '规则第十五条：当两艘机动船交叉相遇致有构成碰撞危险时，有他船在本船右舷的船舶应给他船让路，如当时环境许可，还应避免横越他船的前方。直航船依规则十七条在让路船显然未采取适当行动时可独自采取避让行动。',
    versions: ['colreg-2001', 'syllabus-2022'],
  },
  {
    id: 'CO03',
    category: 'deck',
    type: 'colreg',
    title: '能见度不良声号',
    stem: '能见度不良水域中，一艘在航但已停车并且不对水移动的机动船，应以每次不超过 2 分钟的间隔鸣放：',
    options: [
      '一长声',
      '二长声',
      '一短一长一短声',
      '四短声',
    ],
    answer: 1,
    explanation:
      '规则第三十五条：机动船在航对水移动鸣放一长声；在航但已停车且不对水移动鸣放二长声（间隔约2秒）；失去控制船、操纵能力受到限制船、帆船、从事捕鱼船及拖带船鸣放一长二短。',
    versions: ['colreg-2001', 'syllabus-2022', 'syllabus-2017'],
  },
  {
    id: 'CO04',
    category: 'deck',
    type: 'colreg',
    title: '对遇局面',
    stem: '两艘机动船在相反或接近相反的航向上相遇致有构成碰撞危险时，各应：',
    options: [
      '向左转向，从他船左舷通过',
      '向右转向，从而各从他船的左舷通过',
      '保向保速，等待对方行动',
      '加速直航通过',
    ],
    answer: 1,
    explanation:
      '规则第十四条：对遇局面中各船均应向右转向，从而各从他船的左舷（port side）安全通过。当一船看见来船前后桅灯成一直线或接近一直线和（或）两盏舷灯，夜间只见到一盏白灯不构成对遇。',
    versions: ['colreg-2001', 'syllabus-2022'],
  },
  {
    id: 'CO05',
    category: 'deck',
    type: 'colreg',
    title: '失控船号灯',
    stem: '夜间，一艘在航失控船（船长大于 50 米）应显示的号灯是：',
    options: [
      '前后桅灯、舷灯和尾灯',
      '在最易见处垂直两盏环照红灯，在航对水移动时另加舷灯和尾灯',
      '垂直三盏环照白灯',
      '一盏环照黄灯加桅灯',
    ],
    answer: 1,
    explanation:
      '规则第二十七条：失控船应在最易见处垂直显示两盏环照红灯、两个球体（日间）；对水移动时，还应显示桅灯（L≥50m）、舷灯与尾灯。锚泊时改按锚泊号灯号型显示。',
    versions: ['colreg-2001'],
  },
  {
    id: 'DK01',
    category: 'deck',
    type: 'knowledge',
    title: '罗经航向换算',
    stem: '某船磁罗经航向 CC = 045°，自差 Dev = 2°W，磁差 Var = 5°E，则真航向 TC 为：',
    options: ['038°', '042°', '048°', '052°'],
    answer: 2,
    explanation:
      '换算口诀：TC = CC + Var + Dev（东偏为正、西偏为负）。TC = 045° + (+5°) + (−2°) = 048°。',
    versions: ['syllabus-2022'],
  },

  // ============ 驾驶 · 英语听力 ============
  {
    id: 'EL-D01',
    category: 'deck',
    type: 'listening',
    title: 'VHF 遇险呼叫',
    stem: '听 VHF 通话（可显示原文），选择正确的理解：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Mayday, Mayday, Mayday. This is motor vessel Ocean Star, Ocean Star, Ocean Star. Mayday. My position is one five degrees three zero minutes north, one one zero degrees two zero minutes east. I am on fire and have dangerous cargo on board. I require immediate assistance. Over.',
    },
    options: [
      '主机失灵，请求拖轮协助',
      '船舶失火且载有危险货物，要求立即援助',
      '船舶搁浅，正在倒车脱浅',
      '人员落水，请求医疗援助',
    ],
    answer: 1,
    explanation:
      '关键信息：Mayday（遇险信号）、"I am on fire and have dangerous cargo on board"（失火且载危险品）、"require immediate assistance"（要求立即援助）。注意 SMCP 规定遇险呼叫连呼三次船名。',
    versions: ['english-2021'],
  },
  {
    id: 'EL-D02',
    category: 'deck',
    type: 'listening',
    title: '靠泊指令',
    stem: '听驾驶台指令，选择正确含义：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Stand by engine. Dead slow ahead. Wheel starboard ten. Steer one zero five degrees. Make tug fast on port quarter.',
    },
    options: [
      '微速前进，右舵十度，走 105°，左舷船尾带拖轮',
      '半速前进，左舵十度，走 150°，右舷船首带拖轮',
      '停车，正舵，拖轮顶推右舷',
      '全速后退，右满舵，抛左锚',
    ],
    answer: 0,
    explanation:
      'Dead slow ahead = 微速前进；starboard ten = 右舵十度；steer 105 = 走航向105°；make tug fast on port quarter = 左舷船尾（尾部四分之一处）带拖轮。',
    versions: ['english-2021', 'english-2011'],
  },
  {
    id: 'EL-D03',
    category: 'deck',
    type: 'listening',
    title: '引航与锚泊用语',
    stem: '听通话，判断船舶动态：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Pilot is on board. Proceed to anchorage. We will let go starboard anchor, five shackles in the water. Keep a sharp lookout for passing vessels.',
    },
    options: [
      '引航员已登轮，前往锚地抛右锚、五节入水',
      '引航员已离船，主机定速航行',
      '准备上引航员，备好引水梯',
      '起锚进港，锚链三节水面',
    ],
    answer: 0,
    explanation:
      'Pilot is on board = 引航员已登轮；let go starboard anchor = 抛右锚；five shackles in the water = 五节锚链入水（1 shackle = 27.5 m / 15拓）。',
    versions: ['english-2021'],
  },

  // ============ 轮机 · 专业知识 ============
  {
    id: 'EN01',
    category: 'engine',
    type: 'knowledge',
    title: '四冲程柴油机工作循环',
    stem: '四冲程柴油机完成一个工作循环，曲轴与凸轮轴的转数分别为：',
    options: [
      '曲轴 1 转，凸轮轴 1 转',
      '曲轴 2 转，凸轮轴 1 转',
      '曲轴 4 转，凸轮轴 2 转',
      '曲轴 2 转，凸轮轴 2 转',
    ],
    answer: 1,
    explanation:
      '四冲程机进气、压缩、膨胀、排气四个冲程对应曲轴转 2 圈；每缸进排气阀在一个循环内各启闭一次，故凸轮轴（气阀凸轮）只转 1 圈，传动比为 2:1。',
    versions: ['syllabus-2022'],
  },
  {
    id: 'EN02',
    category: 'engine',
    type: 'knowledge',
    title: '分油机工作原理',
    stem: '离心式分油机净化燃油时，提高分油效果的正确操作是：',
    options: [
      '降低分离筒转速，增大流量',
      '在额定高转速下运行，适当加热并控制最佳分油量',
      '不加热以防止油品变质，满流量通过',
      '降低比重环背压至零',
    ],
    answer: 1,
    explanation:
      '离心分离效果取决于分离因数（与转速平方成正比）、油的黏度（加热至 90℃ 左右降低黏度）和分油量（流量越小停留时间越长）。应保持额定转速、适当加热并按说明书选择比重环（重力环）和最佳分油量。',
    versions: ['syllabus-2022'],
  },
  {
    id: 'EN03',
    category: 'engine',
    type: 'knowledge',
    title: '滑油低压应急',
    stem: '主机运行中发生滑油压力低报警，轮机员首先应采取的措施是：',
    options: [
      '立即关闭所有油柜出口阀',
      '确认压力并启动备用滑油泵，必要时按规程降速或停车检查',
      '提高冷却水温度以稀释滑油',
      '直接盘车检查轴承',
    ],
    answer: 1,
    explanation:
      '滑油低压会迅速造成轴承烧损甚至抱轴。应先核对压力表与传感器，立即启动备用泵恢复压力；若压力不能恢复，按应变部署降速直至安全停车，再查明滤器、管路泄漏或泵的故障原因。',
    versions: ['syllabus-2022', 'syllabus-2017'],
  },
  {
    id: 'EN04',
    category: 'engine',
    type: 'knowledge',
    title: 'MARPOL 防污染',
    stem: '依据 MARPOL 附则 I，400 总吨及以上非油船在特殊区域外排放含油污水，油水分离设备出口含油量不得超过：',
    options: ['15 ppm', '100 ppm', '10 ppm', '50 ppm'],
    answer: 0,
    explanation:
      'MARPOL 附则 I：特殊区域外航行途中排放，经认可的滤油设备处理后排放含油量不超过 15 ppm；在特殊区域内则要求油水经过储存或 15 ppm 报警装置自动停排，即"零排放"管理。',
    versions: ['marpol-current', 'syllabus-2022'],
  },

  // ============ 轮机 · 英语听力 ============
  {
    id: 'EL-E01',
    category: 'engine',
    type: 'listening',
    title: '机舱车钟指令',
    stem: '听机舱指令，选择正确含义：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Bridge to engine room: stand by engine. Ring on stand-by engine. Answer: engine stand by. After half an hour, ring on full ahead. Answer: full ahead.',
    },
    options: [
      '备车；半小时后全速前进并复诵',
      '完车；定速航行',
      '微速进；随即完车',
      '驾驶台命令抛锚',
    ],
    answer: 0,
    explanation:
      'Stand by engine = 备车；full ahead = 全速前进；车钟指令必须复诵（answer back）并核对车钟记录。Finished with engine 才是"完车"。',
    versions: ['english-2021'],
  },
  {
    id: 'EL-E02',
    category: 'engine',
    type: 'listening',
    title: '机舱故障通话',
    stem: '听轮机通话，判断故障与处置：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Chief engineer to bridge: main engine lubricating oil pressure is too low. We have started the standby pump. Request reduce engine speed. If pressure cannot be restored, we have to stop the engine for inspection.',
    },
    options: [
      '冷却水温过高，请求加大海水流量',
      '主机滑油压力过低，已启备用泵，请求降速否则停车检查',
      '发电机并车失败，请求停航',
      '燃油泄漏，请求关闭通风',
    ],
    answer: 1,
    explanation:
      'lubricating oil pressure is too low = 滑油压力过低；started standby pump = 已启动备用泵；reduce speed / stop the engine for inspection = 降速/停车检查。',
    versions: ['english-2021', 'english-2011'],
  },

  // ============ 无线电 · 专业知识 ============
  {
    id: 'RA01',
    category: 'radio',
    type: 'knowledge',
    title: 'EPIRB 与 SART',
    stem: '关于 GMDSS 设备，下列说法正确的是：',
    options: [
      'EPIRB 工作在 9 GHz，用于搜救雷达定位',
      '406 MHz EPIRB 发射含识别码的遇险报警，SART 工作于 9 GHz 供搜救雷达寻位',
      'SART 发射卫星遇险报警，EPIRB 只用于近距离通信',
      '两者均工作在 VHF 70 频道',
    ],
    answer: 1,
    explanation:
      '406 MHz EPIRB（紧急无线电示位标）经极轨卫星（COSPAS-SARSAT）发出带唯一识别码（含MMSI/船位信息）的遇险报警，另有121.5 MHz引示频率；SART（搜救雷达应答器）在 9 GHz（X波段）被搜救雷达触发后回送12个点信号，用于现场寻位。',
    versions: ['gmdss-current', 'syllabus-2022'],
  },
  {
    id: 'RA02',
    category: 'radio',
    type: 'knowledge',
    title: 'DSC 遇险频率',
    stem: 'MF 波段 DSC 遇险与安全呼叫频率是：',
    options: ['2187.5 kHz', '2182 kHz', '156.525 MHz（70 频道）', '8414.5 kHz'],
    answer: 0,
    explanation:
      '2187.5 kHz 是 MF 数字选择性呼叫（DSC）遇险与安全频率；2182 kHz 是 MF 无线电话遇险频率（旧式语音值守）；156.525 MHz 为 VHF 70 频道 DSC；8414.5 kHz 是 HF 8 MHz 波段 DSC 频率之一。',
    versions: ['gmdss-current'],
  },
  {
    id: 'RA03',
    category: 'radio',
    type: 'knowledge',
    title: '海区划分',
    stem: 'GMDSS 中 A1 海区是指：',
    options: [
      '距岸 150 海里以内、MF 岸台覆盖的海域',
      '至少由一个具有 DSC 报警能力的 VHF 岸台所覆盖的海域（约距岸 25 海里以内）',
      'INMARSAT 静止卫星覆盖的海域',
      '南北纬 70° 以外的极区海域',
    ],
    answer: 1,
    explanation:
      'A1：VHF 岸台 DSC 连续覆盖区（约25海里）；A2：MF 岸台 DSC 覆盖区（除A1外，约100–150海里）；A3：INMARSAT 静止卫星覆盖区（南北纬70°之间，除A1/A2）；A4：A1/A2/A3 以外的极区海域，依靠 HF 与极轨卫星设备。',
    versions: ['gmdss-current', 'syllabus-2022', 'syllabus-2017'],
  },
  {
    id: 'RA04',
    category: 'radio',
    type: 'knowledge',
    title: 'VHF 16 频道',
    stem: 'VHF 16 频道（156.800 MHz）的用途是：',
    options: [
      '船舶引航业务专用频道',
      '国际无线电话遇险、安全与呼叫频道',
      '船舶气象传真广播频道',
      '港口国监督检查专用频道',
    ],
    answer: 1,
    explanation:
      'VHF CH16（156.800 MHz）是国际统一的无线电话遇险、安全和呼叫（回答）频道，所有船舶必须保持守听；遇险呼叫在16频道建立后应切换至工作频道通信，DSC 报警则用 CH70（156.525 MHz）。',
    versions: ['gmdss-current'],
  },

  // ============ 无线电 · 英语听力 ============
  {
    id: 'EL-R01',
    category: 'radio',
    type: 'listening',
    title: 'DSC 遇险确认',
    stem: '听无线电通话，判断其性质：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'All stations, all stations, all stations. This is Guangzhou Coast Radio, Guangzhou Coast Radio, Guangzhou Coast Radio. Mayday relay. Motor vessel Hai Yang reported taking in water in position two zero degrees north, one one four degrees east. All ships in vicinity please keep watch on channel one six.',
    },
    options: [
      '岸台转发的遇险呼叫（Mayday relay），要求附近船舶守听 16 频道',
      '常规引航调度',
      '船舶检疫申报',
      '气象航行警告，与遇险无关',
    ],
    answer: 0,
    explanation:
      'Mayday relay = 岸台或他船转发遇险呼叫；"taking in water" = 进水；"keep watch on channel 16" = 守听VHF 16频道。海岸电台连呼台名三次符合通信程序。',
    versions: ['english-2021', 'gmdss-current'],
  },
  {
    id: 'EL-R02',
    category: 'radio',
    type: 'listening',
    title: '紧急与安全信号',
    stem: '听通话开头语，该通话的优先级是：',
    media: {
      kind: 'speech',
      lang: 'en-US',
      text: 'Pan Pan, Pan Pan, Pan Pan. Hello all stations, this is motor vessel Lucky Star. I have a serious injury on board, one crew member fell into the hold. I require medical advice and ambulance arrangement on arrival.',
    },
    options: [
      'Mayday —— 最高等级遇险，船舶或人员面临严重紧迫危险',
      'Pan Pan —— 紧急信号，有紧急情况但暂不危及船舶安全',
      'Sécurité —— 安全信号，仅发布航行警告',
      '日常业务通话',
    ],
    answer: 1,
    explanation:
      '三级优先级：MAYDAY（遇险，生命/船舶受严重紧迫威胁）、PAN PAN（紧急，如人员重伤、机器故障暂不失控）、SÉCURITÉ（安全，航行警告/气象）。人员重伤请求医疗指导通常用 Pan Pan。',
    versions: ['english-2021'],
  },
];
