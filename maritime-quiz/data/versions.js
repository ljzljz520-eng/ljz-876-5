/**
 * 考试版本目录
 * 每道题的解析都挂载一个或多个"适用考试版本"，current 标识是否为现行版本。
 * 旧版（current=false）仅用于大纲对照学习。
 */
module.exports = [
  {
    id: 'syllabus-2022',
    tag: '2022版考试大纲',
    name: '《中华人民共和国海船船员适任考试大纲》2022版',
    current: true,
  },
  {
    id: 'syllabus-2017',
    tag: '2017版考试大纲',
    name: '《中华人民共和国海船船员适任考试大纲》2017版（旧版对照）',
    current: false,
  },
  {
    id: 'colreg-2001',
    tag: '避碰规则2001修正案',
    name: '《1972年国际海上避碰规则》2001年修正案（现行综合文本）',
    current: true,
  },
  {
    id: 'colreg-1972',
    tag: '避碰规则1972原版',
    name: '《1972年国际海上避碰规则》原始文本（历史对照）',
    current: false,
  },
  {
    id: 'chart-2022',
    tag: '海图作业2022大纲',
    name: '航海学·海图作业（2022版考试大纲，依据中版海图图式 GB 12319/海图编绘规范）',
    current: true,
  },
  {
    id: 'gmdss-current',
    tag: 'GMDSS现行版',
    name: 'GMDSS 无线电人员适任考试大纲（IMO 现行修正案，含 ITU 无线电规则最新规定）',
    current: true,
  },
  {
    id: 'english-2021',
    tag: '英语听力2021版',
    name: '《航海英语听力与会话》2021版（采用 IMO SMCP 标准航海通信用语）',
    current: true,
  },
  {
    id: 'english-2011',
    tag: '英语听力2011版',
    name: '《航海英语听力与会话》2011版（旧版对照）',
    current: false,
  },
  {
    id: 'marpol-current',
    tag: 'MARPOL现行版',
    name: 'MARPOL 73/78 防污染公约现行综合文本',
    current: true,
  },
];
