const QuotesDB = (() => {
  const tips = [
    '上班辛苦啦~',
    '下班啦！',
    '摸鱼中...',
    '今天也要加油呀！',
    '一二在呢~',
    '布布想你啦！',
    '休息一下，看看远方吧~',
    '午休时间到，小憩一会儿吧~',
    '下午好！来杯咖啡提提神 ☕',
    '又是元气满满的一天！',
    '夜深了，该休息啦 🌙',
    '周末快乐！',
    '一二布布陪你度过每一天~',
    '加油！你是最棒的 💪',
    '别太累哦，记得放松~',
    '一二和布布在看着你呢~',
    '今天心情怎么样呀？',
    '好想出去玩呀~',
    '工作再忙也要照顾好自己！',
    '一二布布最喜欢你了~',
    '该起来活动一下啦！',
    '吃点水果补充能量吧 🍎',
    '数数今天笑了几次？',
    '保持微笑，好运自然来~',
    '布布给你加油打气！',
    '一二给你比个心 ❤️',
    '忙完这阵就去吃好吃的吧！',
    '窗外天气怎么样？',
    '听首歌放松一下吧 🎵',
    '你是最可爱的人~',
    '每天进步一点点！',
    '累了就歇歇，没人会怪你的~',
    '一二布布永远支持你！',
    '这个世界因为有你而更美好~',
    '开心是一天，不开心也是一天~',
    '你是独一无二的存在 ✨',
    '烦恼都会过去的~',
    '今天的努力是明天的底气！',
    '做自己喜欢的事，过自己想要的生活~',
    '布布说：你很棒！',
    '一二说：不要放弃呀~',
    '天气好就出去走走吧！',
    '看书了吗？记得给自己充电~',
    '温柔的对待自己~',
    '今天也是被爱的一天~',
  ];

  const waterReminders = [
    '一二说：该喝水啦！💧',
    '布布说：多喝水皮肤好哦~',
    '一二说：喝口水休息一下吧~',
    '布布说：一天八杯水，你喝够了吗？💦',
    '一二说：叮咚！喝水时间到！',
    '布布说：身体缺水啦，快喝点水！',
    '一二说：一二陪你喝水~吨吨吨~',
    '布布说：健康从喝水开始！',
    '一二说：再忙也要记得喝水呀！',
    '布布说：来，一起干一杯水！🥤',
  ];

  const famousQuotes = [
    { text: '人生不如意之事十有八九，常想一二，不思八九。', author: '林清玄' },
    { text: '世界上最遥远的距离，不是生与死的距离，而是我就站在你面前，你却不知道我爱你。', author: '泰戈尔' },
    { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
    { text: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德' },
    { text: '世界以痛吻我，要我报之以歌。', author: '泰戈尔' },
    { text: '你若爱，生活哪里都可爱。', author: '丰子恺' },
    { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
    { text: '心有猛虎，细嗅蔷薇。', author: '萨松' },
    { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
    { text: '不乱于心，不困于情，不畏将来，不念过往。', author: '丰子恺' },
    { text: '既然选择了远方，便只顾风雨兼程。', author: '汪国真' },
    { text: '面朝大海，春暖花开。', author: '海子' },
    { text: '人生的价值，并不是用时间，而是用深度去衡量的。', author: '托尔斯泰' },
    { text: '黑夜无论怎样悠长，白昼总会到来。', author: '莎士比亚' },
    { text: '世上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。', author: '罗曼·罗兰' },
    { text: '活着就是为了改变世界，难道还有其他原因吗？', author: '乔布斯' },
    { text: '千里之行，始于足下。', author: '老子' },
    { text: '己所不欲，勿施于人。', author: '孔子' },
    { text: '三人行，必有我师焉。', author: '孔子' },
    { text: '知之为知之，不知为不知，是知也。', author: '孔子' },
    { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
    { text: '天行健，君子以自强不息。', author: '周易' },
    { text: '海纳百川，有容乃大。', author: '林则徐' },
    { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
    { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名' },
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
    { text: '穷则独善其身，达则兼济天下。', author: '孟子' },
    { text: '勿以恶小而为之，勿以善小而不为。', author: '刘备' },
    { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
    { text: '采菊东篱下，悠然见南山。', author: '陶渊明' },
    { text: '但愿人长久，千里共婵娟。', author: '苏轼' },
    { text: '天生我材必有用，千金散尽还复来。', author: '李白' },
    { text: '会当凌绝顶，一览众山小。', author: '杜甫' },
    { text: '莫愁前路无知己，天下谁人不识君。', author: '高适' },
    { text: '山重水复疑无路，柳暗花明又一村。', author: '陆游' },
    { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍' },
    { text: '人生自古谁无死，留取丹心照汗青。', author: '文天祥' },
    { text: '先天下之忧而忧，后天下之乐而乐。', author: '范仲淹' },
    { text: '业精于勤荒于嬉，行成于思毁于随。', author: '韩愈' },
    { text: '为天地立心，为生民立命。', author: '张载' },
    { text: '幸福不在于拥有多少，而在于计较多少。', author: '佚名' },
    { text: '行动是治愈恐惧的良药。', author: '佚名' },
    { text: '最好的时光是一起虚度的时光。', author: '佚名' },
    { text: '你若盛开，蝴蝶自来。', author: '佚名' },
    { text: '做自己的太阳，无需凭借谁的光。', author: '佚名' },
    { text: '一切都是最好的安排。', author: '佚名' },
    { text: '简单点，再简单点。', author: '佚名' },
    { text: '岁月静好，现世安稳。', author: '胡兰成' },
    { text: '陪伴是最长情的告白。', author: '佚名' },
    { text: '有一分热，发一分光。', author: '鲁迅' },
    { text: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
    { text: '世上本没有路，走的人多了，也便成了路。', author: '鲁迅' },
    { text: '真正的勇士，敢于直面惨淡的人生。', author: '鲁迅' },
    { text: '生活是种律动，须有光有影。', author: '老舍' },
    { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
    { text: '走自己的路，让别人去说吧。', author: '但丁' },
    { text: '天空没有翅膀的痕迹，但鸟儿已经飞过。', author: '泰戈尔' },
    { text: '我们把世界看错了，反说它欺骗我们。', author: '泰戈尔' },
    { text: '不是槌的打击，乃是水的载歌载舞，使鹅卵石臻于完美。', author: '泰戈尔' },
    { text: '当你为错过太阳而哭泣的时候，你也要再错过群星了。', author: '泰戈尔' },
  ];

  let usedQuoteIndices = [];
  let lastQuoteDate = '';

  function resetDailyIfNeeded() {
    const today = new Date().toDateString();
    if (today !== lastQuoteDate) {
      usedQuoteIndices = [];
      lastQuoteDate = today;
    }
  }

  return {
    tips,
    waterReminders,
    famousQuotes,

    getRandomTip() {
      return tips[Math.floor(Math.random() * tips.length)];
    },

    getWaterReminder() {
      return waterReminders[Math.floor(Math.random() * waterReminders.length)];
    },

    getDailyQuotes(count) {
      resetDailyIfNeeded();
      const available = [];
      for (let i = 0; i < famousQuotes.length; i++) {
        if (!usedQuoteIndices.includes(i)) {
          available.push(i);
        }
      }
      if (available.length < count) {
        usedQuoteIndices = [];
        for (let i = 0; i < famousQuotes.length; i++) {
          available.push(i);
        }
      }
      const selected = [];
      const pool = [...available];
      for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const quoteIdx = pool.splice(idx, 1)[0];
        usedQuoteIndices.push(quoteIdx);
        const q = famousQuotes[quoteIdx];
        const speaker = Math.random() < 0.5 ? '一二' : '布布';
        selected.push({
          text: `${speaker}说：${q.text}`,
          author: q.author,
        });
      }
      return selected;
    },
  };
})();
