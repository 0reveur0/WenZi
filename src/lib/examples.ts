export interface Example {
  cn: string;
  en: string;
  vi: string;
}

export const EXAMPLES: Record<string, Example[]> = {
  '你好': [
    { cn: '你好！很高兴认识你。', en: 'Hello! Nice to meet you.', vi: 'Xin chào! Rất vui được gặp bạn.' },
    { cn: '你好，请问你叫什么名字？', en: 'Hello, may I ask your name?', vi: 'Xin chào, cho hỏi bạn tên gì?' },
  ],
  '谢谢': [
    { cn: '谢谢你的帮助。', en: 'Thank you for your help.', vi: 'Cảm ơn bạn đã giúp đỡ.' },
    { cn: '非常谢谢！', en: 'Thank you very much!', vi: 'Cảm ơn rất nhiều!' },
  ],
  '再见': [
    { cn: '明天见！再见！', en: 'See you tomorrow! Goodbye!', vi: 'Hẹn gặp lại ngày mai! Tạm biệt!' },
    { cn: '再见，保重。', en: 'Goodbye, take care.', vi: 'Tạm biệt, giữ gìn sức khỏe.' },
  ],
  '学习': [
    { cn: '我每天学习汉语。', en: 'I study Chinese every day.', vi: 'Tôi học tiếng Trung mỗi ngày.' },
    { cn: '学习是很重要的。', en: 'Learning is very important.', vi: 'Học tập rất quan trọng.' },
  ],
  '朋友': [
    { cn: '他是我最好的朋友。', en: 'He is my best friend.', vi: 'Anh ấy là người bạn thân nhất của tôi.' },
    { cn: '我有很多中国朋友。', en: 'I have many Chinese friends.', vi: 'Tôi có nhiều bạn người Trung Quốc.' },
  ],
  '工作': [
    { cn: '你在哪里工作？', en: 'Where do you work?', vi: 'Bạn làm việc ở đâu?' },
    { cn: '我的工作很有意思。', en: 'My job is very interesting.', vi: 'Công việc của tôi rất thú vị.' },
  ],
  '时间': [
    { cn: '时间过得真快。', en: 'Time passes so fast.', vi: 'Thời gian trôi qua thật nhanh.' },
    { cn: '你有时间吗？', en: 'Do you have time?', vi: 'Bạn có thời gian không?' },
  ],
  '家庭': [
    { cn: '我爱我的家庭。', en: 'I love my family.', vi: 'Tôi yêu gia đình tôi.' },
    { cn: '家庭对我来说很重要。', en: 'Family is very important to me.', vi: 'Gia đình rất quan trọng với tôi.' },
  ],
  '中国': [
    { cn: '中国是一个很大的国家。', en: 'China is a very large country.', vi: 'Trung Quốc là một quốc gia rất lớn.' },
    { cn: '我想去中国旅游。', en: 'I want to travel to China.', vi: 'Tôi muốn đi du lịch Trung Quốc.' },
  ],
  '爱': [
    { cn: '我爱学习中文。', en: 'I love learning Chinese.', vi: 'Tôi yêu học tiếng Trung.' },
    { cn: '爱是最美好的感情。', en: 'Love is the most beautiful feeling.', vi: 'Tình yêu là tình cảm đẹp nhất.' },
  ],
  '书': [
    { cn: '这本书很有意思。', en: 'This book is very interesting.', vi: 'Cuốn sách này rất thú vị.' },
    { cn: '我每天都看书。', en: 'I read books every day.', vi: 'Tôi đọc sách mỗi ngày.' },
  ],
  '水': [
    { cn: '请给我一杯水。', en: 'Please give me a glass of water.', vi: 'Xin hãy cho tôi một ly nước.' },
    { cn: '多喝水对身体好。', en: 'Drinking more water is good for your health.', vi: 'Uống nhiều nước tốt cho sức khỏe.' },
  ],
  '音乐': [
    { cn: '我很喜欢听音乐。', en: 'I really like listening to music.', vi: 'Tôi rất thích nghe nhạc.' },
    { cn: '音乐能让人放松。', en: 'Music can help people relax.', vi: 'Âm nhạc có thể giúp người ta thư giãn.' },
  ],
  '老师': [
    { cn: '我的老师很好。', en: 'My teacher is very good.', vi: 'Giáo viên của tôi rất tốt.' },
    { cn: '老师，您好！', en: 'Hello, teacher!', vi: 'Kính chào thầy/cô!' },
  ],
  '学生': [
    { cn: '她是一个好学生。', en: 'She is a good student.', vi: 'Cô ấy là một học sinh giỏi.' },
    { cn: '我是大学生。', en: 'I am a university student.', vi: 'Tôi là sinh viên đại học.' },
  ],
  '爸爸': [
    { cn: '我爸爸很高。', en: 'My father is very tall.', vi: 'Bố tôi rất cao.' },
    { cn: '爸爸，我爱你！', en: 'Dad, I love you!', vi: 'Bố ơi, con yêu bố!' },
  ],
  '妈妈': [
    { cn: '妈妈做的饭很好吃。', en: 'The food my mom makes is delicious.', vi: 'Cơm mẹ nấu rất ngon.' },
    { cn: '妈妈，您辛苦了。', en: 'Mom, you have worked hard.', vi: 'Mẹ ơi, mẹ đã vất vả rồi.' },
  ],
  '今天': [
    { cn: '今天天气怎么样？', en: 'How is the weather today?', vi: 'Hôm nay thời tiết thế nào?' },
    { cn: '今天是我的生日。', en: 'Today is my birthday.', vi: 'Hôm nay là sinh nhật của tôi.' },
  ],
  '明天': [
    { cn: '明天我们去哪里？', en: 'Where are we going tomorrow?', vi: 'Ngày mai chúng ta đi đâu?' },
    { cn: '明天见！', en: 'See you tomorrow!', vi: 'Hẹn gặp ngày mai!' },
  ],
  '吃': [
    { cn: '你吃了吗？', en: 'Have you eaten?', vi: 'Bạn đã ăn chưa?' },
    { cn: '我喜欢吃中国菜。', en: 'I like to eat Chinese food.', vi: 'Tôi thích ăn món Trung Quốc.' },
  ],
  '喝': [
    { cn: '你喝什么？', en: 'What would you like to drink?', vi: 'Bạn muốn uống gì?' },
    { cn: '我喜欢喝茶。', en: 'I like to drink tea.', vi: 'Tôi thích uống trà.' },
  ],
  '看': [
    { cn: '你看过这部电影吗？', en: 'Have you seen this movie?', vi: 'Bạn đã xem bộ phim này chưa?' },
    { cn: '我在看书。', en: 'I am reading a book.', vi: 'Tôi đang đọc sách.' },
  ],
  '说': [
    { cn: '你会说中文吗？', en: 'Can you speak Chinese?', vi: 'Bạn có biết nói tiếng Trung không?' },
    { cn: '请说慢一点。', en: 'Please speak more slowly.', vi: 'Xin hãy nói chậm hơn.' },
  ],
  '去': [
    { cn: '我想去北京。', en: 'I want to go to Beijing.', vi: 'Tôi muốn đi Bắc Kinh.' },
    { cn: '你去哪里？', en: 'Where are you going?', vi: 'Bạn đi đâu vậy?' },
  ],
  '来': [
    { cn: '你是从哪里来的？', en: 'Where do you come from?', vi: 'Bạn đến từ đâu?' },
    { cn: '请进来！', en: 'Please come in!', vi: 'Xin mời vào!' },
  ],
  '好': [
    { cn: '你好！', en: 'Hello! / How are you?', vi: 'Xin chào!' },
    { cn: '这个主意很好。', en: 'This idea is very good.', vi: 'Ý kiến này rất hay.' },
  ],
  '大': [
    { cn: '北京是一个大城市。', en: 'Beijing is a large city.', vi: 'Bắc Kinh là một thành phố lớn.' },
    { cn: '这个房间很大。', en: 'This room is very big.', vi: 'Căn phòng này rất rộng.' },
  ],
  '小': [
    { cn: '这只猫很小。', en: 'This cat is very small.', vi: 'Con mèo này rất nhỏ.' },
    { cn: '我有一个小问题。', en: 'I have a small question.', vi: 'Tôi có một câu hỏi nhỏ.' },
  ],
  '高兴': [
    { cn: '很高兴认识你！', en: 'Nice to meet you!', vi: 'Rất vui được gặp bạn!' },
    { cn: '我今天很高兴。', en: 'I am very happy today.', vi: 'Hôm nay tôi rất vui.' },
  ],
  '漂亮': [
    { cn: '她很漂亮。', en: 'She is very beautiful.', vi: 'Cô ấy rất đẹp.' },
    { cn: '这件衣服真漂亮！', en: 'This dress is so beautiful!', vi: 'Chiếc váy này thật đẹp!' },
  ],
  '学校': [
    { cn: '我的学校很大。', en: 'My school is very big.', vi: 'Trường tôi rất lớn.' },
    { cn: '学校里有很多学生。', en: 'There are many students at school.', vi: 'Trong trường có rất nhiều học sinh.' },
  ],
  '中文': [
    { cn: '我在学中文。', en: 'I am learning Chinese.', vi: 'Tôi đang học tiếng Trung.' },
    { cn: '中文很难，但很有趣。', en: 'Chinese is difficult, but very interesting.', vi: 'Tiếng Trung rất khó nhưng rất thú vị.' },
  ],
  '汉语': [
    { cn: '汉语是世界上最难的语言之一。', en: 'Chinese is one of the most difficult languages in the world.', vi: 'Tiếng Hán là một trong những ngôn ngữ khó nhất thế giới.' },
    { cn: '我学汉语已经三年了。', en: 'I have been studying Chinese for three years.', vi: 'Tôi đã học tiếng Hán được ba năm rồi.' },
  ],
  '越南': [
    { cn: '越南是一个美丽的国家。', en: 'Vietnam is a beautiful country.', vi: 'Việt Nam là một đất nước tươi đẹp.' },
    { cn: '我来自越南。', en: 'I am from Vietnam.', vi: 'Tôi đến từ Việt Nam.' },
  ],
};

export function getExamples(simplified: string): Example[] {
  return EXAMPLES[simplified] || [];
}
