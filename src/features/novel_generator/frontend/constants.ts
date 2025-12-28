import type { NovelState, ShortStoryTemplate } from './types'

// 选项数据
export const GENRE_OPTIONS = [
  '科幻', '奇幻', '悬疑', '爱情', '历史', '军事', '都市', '武侠', '仙侠', '游戏', '体育', '灵异'
]

export const STYLE_OPTIONS = [
  '现实主义', '浪漫主义', '古典主义', '现代主义', '魔幻现实主义', '黑色幽默', '意识流', '自然主义'
]

// 短篇小说快捷模板
export const SHORT_STORY_TEMPLATES: ShortStoryTemplate[] = [
  {
    id: 'suspense-mystery',
    name: '悬疑推理',
    icon: '🔍',
    description: '扣人心弦的推理故事',
    genre: '悬疑',
    style: '现实主义',
    plotPoints: [
      '神秘事件发生',
      '线索逐步浮现',
      '真相出人意料',
      '结局发人深省'
    ],
    suggestedLength: '2000-3000字',
    requirement: '创作一个扣人心弦的悬疑推理故事。\n\n故事结构：\n- 开篇：一个神秘事件发生，引起读者好奇\n- 发展：主角调查线索，揭示部分真相\n- 高潮：真相即将揭晓，出现意外转折\n- 结局：真相大白，留下深刻印象\n\n要求：\n- 线索设计合理，逻辑严密\n- 人物刻画鲜明，动机清晰\n- 节奏紧凑，保持悬念\n- 结局出人意料但合情合理'
  },
  {
    id: 'romance-sweet',
    name: '甜蜜爱情',
    icon: '💝',
    description: '温馨治愈的爱情故事',
    genre: '爱情',
    style: '浪漫主义',
    plotPoints: [
      '命运般的相遇',
      '情感逐渐升温',
      '小误会小波折',
      '甜蜜圆满结局'
    ],
    suggestedLength: '1500-2500字',
    requirement: '创作一个温馨甜蜜的爱情故事。\n\n故事结构：\n- 开篇：男女主角以特别的方式相遇\n- 发展：通过互动展现两人性格，情感升温\n- 高潮：出现小误会或小障碍，考验感情\n- 结局：误会解除，两人确认心意\n\n要求：\n- 人物性格互补，有化学反应\n- 情节温馨自然，不狗血\n- 细节描写生动，展现情感细腻\n- 结局甜蜜治愈，给人美好感受'
  },
  {
    id: 'scifi-future',
    name: '科幻未来',
    icon: '🚀',
    description: '充满想象的未来世界',
    genre: '科幻',
    style: '现代主义',
    plotPoints: [
      '未来世界设定',
      '科技带来的问题',
      '人性与科技碰撞',
      '发人深省的结局'
    ],
    suggestedLength: '2000-3000字',
    requirement: '创作一个充满想象力的科幻短篇。\n\n故事结构：\n- 开篇：展现独特的未来世界设定\n- 发展：引出科技发展带来的核心冲突\n- 高潮：人性与科技的激烈碰撞\n- 结局：引发对未来的思考\n\n要求：\n- 世界观设定新颖且自洽\n- 科技元素有创意但不脱离逻辑\n- 探讨深刻的人性或社会问题\n- 文字简洁有力，画面感强'
  },
  {
    id: 'fantasy-adventure',
    name: '奇幻冒险',
    icon: '⚔️',
    description: '激动人心的冒险历程',
    genre: '奇幻',
    style: '魔幻现实主义',
    plotPoints: [
      '平凡世界的召唤',
      '踏上冒险之旅',
      '面对重大考验',
      '成长与收获'
    ],
    suggestedLength: '2500-3500字',
    requirement: '创作一个激动人心的奇幻冒险故事。\n\n故事结构：\n- 开篇：主角的平凡生活被打破，接到冒险召唤\n- 发展：进入奇幻世界，经历各种奇遇\n- 高潮：面对最大的挑战和考验\n- 结局：完成任务，获得成长\n\n要求：\n- 奇幻世界观独特有趣\n- 冒险过程惊险刺激\n- 主角成长轨迹清晰\n- 节奏明快，富有想象力'
  },
  {
    id: 'slice-of-life',
    name: '都市生活',
    icon: '🏙️',
    description: '真实温暖的生活切片',
    genre: '都市',
    style: '现实主义',
    plotPoints: [
      '日常生活场景',
      '遇到小困难',
      '温暖的人情味',
      '治愈的感悟'
    ],
    suggestedLength: '1500-2500字',
    requirement: '创作一个真实温暖的都市生活故事。\n\n故事结构：\n- 开篇：展现主角的日常生活\n- 发展：遇到生活中的小困难或小烦恼\n- 高潮：通过他人帮助或自我领悟找到解决方法\n- 结局：获得温暖治愈的感悟\n\n要求：\n- 贴近现实生活，引起共鸣\n- 人物真实可信，有烟火气\n- 细节描写生动，情感细腻\n- 传递正能量，给人温暖'
  },
  {
    id: 'horror-thriller',
    name: '恐怖惊悚',
    icon: '👻',
    description: '令人毛骨悚然的故事',
    genre: '灵异',
    style: '黑色幽默',
    plotPoints: [
      '诡异氛围营造',
      '恐怖逐步升级',
      '惊悚高潮',
      '意料之外的真相'
    ],
    suggestedLength: '1500-2500字',
    requirement: '创作一个令人毛骨悚然的恐怖故事。\n\n故事结构：\n- 开篇：营造诡异不安的氛围\n- 发展：恐怖感逐步升级，制造悬念\n- 高潮：最恐怖的场景出现\n- 结局：揭示意料之外的真相\n\n要求：\n- 氛围营造到位，细节渲染恐怖感\n- 节奏把握好，恐怖逐步升级\n- 避免单纯血腥，注重心理恐怖\n- 结局有反转或深意'
  }
]

// 初始状态
export const INITIAL_STATE: NovelState = {
  form: {
    title: '',
    genre: '',
    style: '',
    requirement: '',
  },
  content: {
    generated: '',
    streaming: '',
  },
  isStreaming: false,

}
