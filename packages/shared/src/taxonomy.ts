/**
 * 平台二级技能库 —— 全局唯一事实来源。
 *
 * 级联选择器、心愿推荐排除逻辑、集市筛选、以及 LLM 受限分类的 prompt 全部读这一份，
 * 任何消费方都不得自行复制或硬编码技能名。
 *
 * id 是稳定 slug（入库、prompt、校验都用它），label 只作展示。
 * aliases 是提升 LLM 命中率与检索召回的最大杠杆：用户写「爬虫」要能落到 code.python。
 */

export interface Skill {
  /** 稳定 slug，跨版本不变，LLM 只允许返回这个 */
  readonly id: string
  /** 展示名（含拉丁与中文） */
  readonly label: string
  /** 检索与 LLM 映射用的别名，覆盖口语、工具名、同义词 */
  readonly aliases: readonly string[]
}

export interface SkillCategory {
  readonly id: string
  readonly label: string
  readonly skills: readonly Skill[]
}

export const TAXONOMY: readonly SkillCategory[] = [
  {
    id: 'code',
    label: '编程与科技',
    skills: [
      {
        id: 'code.python',
        label: 'Python / 爬虫',
        aliases: ['Python', '爬虫', 'Scrapy', '脚本', '自动化', '数据抓取', 'selenium'],
      },
      {
        id: 'code.web',
        label: 'Web前端 / React',
        aliases: ['前端', 'React', 'Vue', 'HTML', 'CSS', 'JavaScript', 'TypeScript', '网页', '小程序'],
      },
      {
        id: 'code.data',
        label: '数据分析 / SQL',
        aliases: ['数据分析', 'SQL', '数据库', 'Pandas', 'BI', 'Excel', '可视化', '报表'],
      },
      {
        id: 'code.prompt',
        label: 'AI提示词工程 / 提效',
        aliases: ['提示词', 'Prompt', '大模型', 'ChatGPT', 'AI提效', '工作流', 'Agent'],
      },
    ],
  },
  {
    id: 'art',
    label: '艺术与音乐',
    skills: [
      {
        id: 'art.guitar',
        label: '民谣吉他 / 尤克里里',
        aliases: ['吉他', '尤克里里', '弹唱', '和弦', '指弹', '编配', '扫弦'],
      },
      {
        id: 'art.piano',
        label: '钢琴伴奏',
        aliases: ['钢琴', '伴奏', '乐理', '即兴伴奏', '识谱'],
      },
      {
        id: 'art.illustration',
        label: '数字插画 / Procreate',
        aliases: ['插画', '板绘', 'Procreate', '数位板', '厚涂', '平涂', '原画'],
      },
      {
        id: 'art.vocal',
        label: '声乐进阶',
        aliases: ['声乐', '唱歌', '气息', '发声', '高音', '共鸣'],
      },
    ],
  },
  {
    id: 'design',
    label: '视觉与设计',
    skills: [
      {
        id: 'design.photo',
        label: '摄影构图 / 后期调色',
        aliases: ['摄影', '构图', '调色', 'Lightroom', '布光', '人像', '后期'],
      },
      {
        id: 'design.uiux',
        label: 'UI/UX原型设计',
        aliases: ['UI', 'UX', '原型', 'Figma', '交互设计', '用户体验', '界面设计'],
      },
      {
        id: 'design.video',
        label: '视频剪辑 / PR/剪映',
        aliases: ['剪辑', 'Premiere', '剪映', '短视频', '特效', '卡点', '调音'],
      },
      {
        id: 'design.3d',
        label: '3D建模',
        aliases: ['3D', '建模', 'Blender', 'C4D', '渲染', '材质', '场景'],
      },
    ],
  },
  {
    id: 'life',
    label: '生活与语言',
    skills: [
      {
        id: 'life.english',
        label: '日常口语 / 雅思托福',
        aliases: ['英语', '口语', '雅思', '托福', '留学', '备考', '四六级'],
      },
      {
        id: 'life.lang',
        label: '小语种入门',
        aliases: ['日语', '韩语', '法语', '德语', '西班牙语', '小语种', '五十音'],
      },
      {
        id: 'life.baking',
        label: '烘焙料理',
        aliases: ['烘焙', '料理', '甜点', '面包', '咖啡', '家常菜', '拉花'],
      },
      {
        id: 'life.fitness',
        label: '健身塑形 / 动作指导',
        aliases: ['健身', '塑形', '减脂', '增肌', '瑜伽', '动作', '体态'],
      },
    ],
  },
  {
    id: 'career',
    label: '职场与学术',
    skills: [
      {
        id: 'career.interview',
        label: '求职面试辅导',
        aliases: ['面试', '简历', '求职', '模拟面试', 'offer', '谈薪'],
      },
      {
        id: 'career.paper',
        label: '论文写作逻辑',
        aliases: ['论文', '写作', '文献', '开题', '逻辑', '综述', '查重'],
      },
      {
        id: 'career.bp',
        label: '商业计划书编制',
        aliases: ['商业计划书', 'BP', '创业', '融资', '路演', '商业模式'],
      },
      {
        id: 'career.product',
        label: '产品需求拆解',
        aliases: ['产品', '需求', 'PRD', '用户研究', '原型评审', '竞品分析'],
      },
    ],
  },
]
