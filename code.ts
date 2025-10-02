// UX 톤 적용하기 - 고급 텍스트 분석 및 톤 변환 플러그인
// 선택된 텍스트 노드를 분석하고 UX Writing의 친근한 톤으로 변환합니다.

// 피그마 문서에 접근할 수 있는 메인 코드 파일
// UI는 "ui.html"에서 처리됩니다.

// HTML 페이지 표시 (더 큰 크기로 설정)
figma.showUI(__html__, { width: 480, height: 600 });

// 인터페이스 정의
interface ToneRule {
  pattern: string;
  replacement: string;
  category: 'formal_to_friendly' | 'command_to_action' | 'polite_to_casual' | 'ending_tone' | 'command_to_polite';
  description: string;
}

interface TextAnalysis {
  sentenceType: 'declarative' | 'interrogative' | 'imperative' | 'exclamatory' | 'mixed';
  emotionalTone: 'neutral' | 'enthusiastic' | 'friendly' | 'professional' | 'playful';
  keywordFrequency: { [key: string]: number };
  topKeywords: string[];
  formalityScore: number; // 0-100 (0: 매우 친근함, 100: 매우 격식적)
  readabilityScore: number; // 0-100 (0: 어려움, 100: 쉬움)
  endingPatterns: { [key: string]: number }; // 어미 패턴 빈도
}

interface UXToneProfile {
  currentTone: string;
  recommendedTone: string;
  confidence: number;
  applicableRules: Array<{
    rule: ToneRule;
    matches: string[];
    preview: string;
  }>;
  analysis: TextAnalysis;
}

interface ConversionSuggestion {
  original: string;
  converted: string;
  rule: ToneRule;
  confidence: number;
  nodeId: string;
}

// 확장 가능한 UX Writing 톤 변환 규칙 정의
const toneRules: ToneRule[] = [
  // 핵심 UX Writing 패턴들 (사용자 제공)
  {
    pattern: '확인해보세요',
    replacement: '확인하기',
    category: 'formal_to_friendly',
    description: '친근한 어조'
  },
  {
    pattern: '이용해보세요',
    replacement: '이용하기',
    category: 'formal_to_friendly',
    description: '간결한 표현'
  },
  {
    pattern: '참여해보세요',
    replacement: '참여하기',
    category: 'formal_to_friendly',
    description: '직접적 유도'
  },
  {
    pattern: '신청해보세요',
    replacement: '신청하기',
    category: 'formal_to_friendly',
    description: '간편함 강조'
  },
  {
    pattern: '문의해보세요',
    replacement: '문의하기',
    category: 'formal_to_friendly',
    description: '쉬운 접근'
  },
  {
    pattern: '됩니다',
    replacement: '돼요',
    category: 'ending_tone',
    description: '친근한 확인'
  },
  {
    pattern: '입니다',
    replacement: '이에요',
    category: 'ending_tone',
    description: '부드러운 설명'
  },
  {
    pattern: '있습니다',
    replacement: '있어요',
    category: 'ending_tone',
    description: '친근한 안내'
  },
  {
    pattern: '하시면',
    replacement: '하면',
    category: 'polite_to_casual',
    description: '간결한 조건'
  },
  {
    pattern: '하십시오',
    replacement: '해주세요',
    category: 'command_to_polite',
    description: '정중한 요청'
  },
  
  // 어미 패턴 기반 추가 규칙들
  {
    pattern: '하세요',
    replacement: '하기',
    category: 'polite_to_casual',
    description: '정중한 요청을 간단한 행동으로 변경'
  },
  {
    pattern: '해보세요',
    replacement: '해보기',
    category: 'polite_to_casual',
    description: '권유를 친근한 제안으로 변경'
  },
  {
    pattern: '확인하세요',
    replacement: '확인하기',
    category: 'polite_to_casual',
    description: '정중한 확인 요청을 캐주얼하게 변경'
  },
  {
    pattern: '이용하세요',
    replacement: '이용하기',
    category: 'polite_to_casual',
    description: '정중한 이용 권유를 간단하게 변경'
  },
  {
    pattern: '참여하세요',
    replacement: '참여하기',
    category: 'polite_to_casual',
    description: '정중한 참여 요청을 직접적으로 변경'
  },
  {
    pattern: '신청하세요',
    replacement: '신청하기',
    category: 'polite_to_casual',
    description: '정중한 신청 안내를 간편하게 변경'
  },
  
  // 기존 확장 규칙들 (호환성 유지)
  {
    pattern: '클릭해보세요',
    replacement: '클릭하기',
    category: 'formal_to_friendly',
    description: '정중한 클릭 요청을 직접적인 행동으로 변경'
  },
  {
    pattern: '선택해보세요',
    replacement: '선택하기',
    category: 'formal_to_friendly',
    description: '정중한 선택 요청을 간단한 행동으로 변경'
  },
  {
    pattern: '입력해보세요',
    replacement: '입력하기',
    category: 'formal_to_friendly',
    description: '정중한 입력 요청을 직접적인 행동으로 변경'
  },
  {
    pattern: '저장해보세요',
    replacement: '저장하기',
    category: 'formal_to_friendly',
    description: '정중한 저장 요청을 간단한 행동으로 변경'
  },
  {
    pattern: '진행하십시오',
    replacement: '진행하기',
    category: 'command_to_action',
    description: '명령형 표현을 친근한 행동 유도로 변경'
  },
  {
    pattern: '완료하십시오',
    replacement: '완료하기',
    category: 'command_to_action',
    description: '명령형 완료 요청을 친근한 행동으로 변경'
  },
  {
    pattern: '삭제하세요',
    replacement: '삭제하기',
    category: 'polite_to_casual',
    description: '정중한 삭제 요청을 간단한 행동으로 변경'
  },
  {
    pattern: '수정하세요',
    replacement: '수정하기',
    category: 'polite_to_casual',
    description: '정중한 수정 요청을 직접적인 행동으로 변경'
  },
  {
    pattern: '가능합니다',
    replacement: '가능해요',
    category: 'ending_tone',
    description: '격식적인 가능성 표현을 친근하게 변경'
  },
  {
    pattern: '필요합니다',
    replacement: '필요해요',
    category: 'ending_tone',
    description: '격식적인 필요성 표현을 친근하게 변경'
  }
];

/**
 * 텍스트의 문장 유형을 분석하는 함수
 * @param text 분석할 텍스트
 * @returns 문장 유형
 */
function analyzeSentenceType(text: string): TextAnalysis['sentenceType'] {
  const questionMarks = (text.match(/\?/g) || []).length;
  const exclamationMarks = (text.match(/!/g) || []).length;
  const imperativePatterns = ['하세요', '하십시오', '해보세요', '하기'];
  
  if (questionMarks > 0) return 'interrogative';
  if (exclamationMarks > 0) return 'exclamatory';
  if (imperativePatterns.some(pattern => text.includes(pattern))) return 'imperative';
  
  return 'declarative';
}

/**
 * 텍스트의 감정적 톤을 분석하는 함수 (개선된 버전)
 * @param text 분석할 텍스트
 * @returns 감정적 톤
 */
function analyzeEmotionalTone(text: string): TextAnalysis['emotionalTone'] {
  // 감정 키워드 정의
  const emotionKeywords = {
    enthusiastic: ['설렘', '최고', '특가', '대박', '놀라운', '환상', '완벽', '!', '최신', '혁신', '놀라운'],
    friendly: ['함께', '나만의', '여러분', '친구', '가족', '편안', '따뜻', '소중한', '반가운', '고마운'],
    professional: ['서비스', '품질', '전문', '안전', '신뢰', '보장', '관리', '시스템', '솔루션', '지원'],
    playful: ['재미', '즐거운', 'ㅋ', '귀여운', '신나는', '웃음', '놀이', '깜짝', '톡톡', '알록달록']
  };
  
  // 각 감정 카테고리별 점수 계산
  const scores = {
    enthusiastic: 0,
    friendly: 0,
    professional: 0,
    playful: 0
  };
  
  // 키워드 매칭으로 점수 계산
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    keywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      scores[emotion as keyof typeof scores] += matches;
    });
  });
  
  // 감탄부호 특별 처리 (enthusiastic 가중치)
  const exclamationCount = (text.match(/!/g) || []).length;
  scores.enthusiastic += exclamationCount * 2;
  
  // 이모티콘 패턴 감지 (playful 가중치)
  const emoticonPatterns = ['ㅋ', 'ㅎ', '^^', ':)', '😊', '🎉', '✨'];
  emoticonPatterns.forEach(pattern => {
    const matches = (text.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    scores.playful += matches;
  });
  
  // 최고 점수 감정 찾기
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'neutral';
  
  const dominantEmotion = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
  return dominantEmotion as TextAnalysis['emotionalTone'] || 'neutral';
}

/**
 * 키워드 빈도를 분석하는 함수
 * @param text 분석할 텍스트
 * @returns 키워드 빈도 객체
 */
function analyzeKeywordFrequency(text: string): { frequency: { [key: string]: number }, topKeywords: string[] } {
  // 한국어 불용어 목록
  const stopWords = ['을', '를', '이', '가', '은', '는', '의', '에', '에서', '으로', '로', '와', '과', '하고'];
  
  // 텍스트를 단어로 분할 (한국어 특성 고려)
  const words = text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .map(word => word.toLowerCase());
  
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const topKeywords = Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return { frequency, topKeywords };
}

/**
 * 격식성 점수를 계산하는 함수 (0-100)
 * @param text 분석할 텍스트
 * @returns 격식성 점수
 */
function calculateFormalityScore(text: string): number {
  const formalPatterns = ['하십시오', '됩니다', '입니다', '습니다', '해보세요'];
  const casualPatterns = ['해요', '이에요', '돼요', '하기', '어요'];
  
  const formalMatches = formalPatterns.reduce((count, pattern) => 
    count + (text.match(new RegExp(pattern, 'g')) || []).length, 0);
  const casualMatches = casualPatterns.reduce((count, pattern) => 
    count + (text.match(new RegExp(pattern, 'g')) || []).length, 0);
  
  const totalMatches = formalMatches + casualMatches;
  if (totalMatches === 0) return 50; // 중립
  
  return Math.round((formalMatches / totalMatches) * 100);
}

/**
 * 가독성 점수를 계산하는 함수 (0-100)
 * @param text 분석할 텍스트
 * @returns 가독성 점수
 */
function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgCharsPerWord = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // 간단한 가독성 공식 (낮은 값일수록 읽기 쉬움)
  const complexity = (avgWordsPerSentence * 0.5) + (avgCharsPerWord * 2);
  const readabilityScore = Math.max(0, Math.min(100, 100 - complexity * 5));
  
  return Math.round(readabilityScore);
}

/**
 * 어미 패턴을 분석하는 함수
 * @param text 분석할 텍스트
 * @returns 어미 패턴 빈도 객체
 */
function analyzeEndingPatterns(text: string): { [key: string]: number } {
  // 자주 나오는 어미 패턴 정의
  const endingPatterns: { [key: string]: string } = {
    '하세요': '하기',
    '해보세요': '해보기', 
    '확인하세요': '확인하기',
    '이용하세요': '이용하기',
    '참여하세요': '참여하기',
    '신청하세요': '신청하기',
    '됩니다': '돼요',
    '입니다': '이에요',
    '있습니다': '있어요',
    '하십시오': '해주세요',
    '하시면': '하면'
  };
  
  const patternFrequency: { [key: string]: number } = {};
  
  // 각 패턴의 빈도 계산
  Object.keys(endingPatterns).forEach(pattern => {
    const matches = (text.match(new RegExp(pattern, 'g')) || []).length;
    if (matches > 0) {
      patternFrequency[pattern] = matches;
    }
  });
  
  return patternFrequency;
}

/**
 * 텍스트를 종합적으로 분석하는 함수
 * @param text 분석할 텍스트
 * @returns 텍스트 분석 결과
 */
function analyzeText(text: string): TextAnalysis {
  const { frequency, topKeywords } = analyzeKeywordFrequency(text);
  const endingPatterns = analyzeEndingPatterns(text);
  
  return {
    sentenceType: analyzeSentenceType(text),
    emotionalTone: analyzeEmotionalTone(text),
    keywordFrequency: frequency,
    topKeywords,
    formalityScore: calculateFormalityScore(text),
    readabilityScore: calculateReadabilityScore(text),
    endingPatterns
  };
}

/**
 * UX 톤 프로파일을 생성하는 함수
 * @param texts 분석할 텍스트 배열
 * @returns UX 톤 프로파일
 */
function generateUXToneProfile(texts: string[]): UXToneProfile {
  const combinedText = texts.join(' ');
  const analysis = analyzeText(combinedText);
  
  // 적용 가능한 규칙 찾기
  const applicableRules: UXToneProfile['applicableRules'] = [];
  
  for (const rule of toneRules) {
    const matches: string[] = [];
    const regex = new RegExp(rule.pattern, 'g');
    
    for (const text of texts) {
      const textMatches = text.match(regex);
      if (textMatches) {
        matches.push(...textMatches);
      }
    }
    
    if (matches.length > 0) {
      const preview = combinedText.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
      applicableRules.push({
        rule,
        matches: [...new Set(matches)], // 중복 제거
        preview
      });
    }
  }
  
  // 현재 톤과 추천 톤 결정
  let currentTone = '중립적';
  let recommendedTone = 'UX 친화적';
  
  if (analysis.formalityScore > 70) {
    currentTone = '격식적';
  } else if (analysis.formalityScore < 30) {
    currentTone = '친근함';
  }
  
  if (analysis.emotionalTone === 'formal') {
    currentTone = '격식적';
  } else if (analysis.emotionalTone === 'friendly') {
    currentTone = '친근함';
    recommendedTone = '현재 톤 유지';
  }
  
  // 신뢰도 계산
  const confidence = Math.min(100, applicableRules.length * 20 + analysis.formalityScore * 0.3);
  
  return {
    currentTone,
    recommendedTone,
    confidence: Math.round(confidence),
    applicableRules,
    analysis
  };
}

/**
 * 선택된 텍스트 노드들을 가져오는 함수
 * @returns 텍스트 노드 배열
 */
function getSelectedTextNodes(): TextNode[] {
  const selectedNodes = figma.currentPage.selection;
  const textNodes: TextNode[] = [];
  
  for (const node of selectedNodes) {
    if (node.type === 'TEXT') {
      textNodes.push(node as TextNode);
    }
  }
  
  return textNodes;
}

/**
 * 텍스트에 톤 변환 규칙을 적용하는 함수
 * @param text 원본 텍스트
 * @param selectedRules 적용할 규칙들
 * @returns 변환된 텍스트
 */
function applyToneRules(text: string, selectedRules: ToneRule[]): string {
  let convertedText = text;
  
  for (const rule of selectedRules) {
    convertedText = convertedText.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
  }
  
  return convertedText;
}

// UI에서 보낸 메시지 처리
figma.ui.onmessage = async (msg: { 
  type: string; 
  selectedRules?: string[];
  action?: string;
}) => {
  try {
    if (msg.type === 'analyze-text') {
      // 선택된 텍스트 노드들 가져오기
      const textNodes = getSelectedTextNodes();
      
      if (textNodes.length === 0) {
        figma.notify('텍스트 노드를 선택해주세요! 📝', { error: true });
        return;
      }
      
      // 텍스트 추출 및 분석
      const texts = textNodes.map(node => node.characters);
      const profile = generateUXToneProfile(texts);
      
      // 변환 제안 생성
      const suggestions: ConversionSuggestion[] = [];
      
      textNodes.forEach((node, index) => {
        profile.applicableRules.forEach(({ rule }) => {
          const original = node.characters;
          const converted = applyToneRules(original, [rule]);
          
          if (original !== converted) {
            suggestions.push({
              original,
              converted,
              rule,
              confidence: 85, // 기본 신뢰도
              nodeId: node.id
            });
          }
        });
      });
      
      // UI에 분석 결과 전송
      figma.ui.postMessage({
        type: 'analysis-result',
        data: {
          profile,
          suggestions,
          nodeCount: textNodes.length
        }
      });
    }
    
    if (msg.type === 'apply-tone') {
      const textNodes = getSelectedTextNodes();
      const selectedRulePatterns = msg.selectedRules || [];
      
      if (textNodes.length === 0) {
        figma.notify('텍스트 노드를 선택해주세요! 📝', { error: true });
        return;
      }
      
      // 선택된 규칙들 필터링
      const selectedRules = toneRules.filter(rule => 
        selectedRulePatterns.includes(rule.pattern)
      );
      
      let convertedCount = 0;
      
      // 각 텍스트 노드에 톤 변환 적용
      for (const textNode of textNodes) {
        const originalText = textNode.characters;
        const convertedText = applyToneRules(originalText, selectedRules);
        
        if (originalText !== convertedText) {
          // 폰트 로드 (텍스트 수정을 위해 필요)
          await figma.loadFontAsync(textNode.fontName as FontName);
          
          // 텍스트 변경
          textNode.characters = convertedText;
          convertedCount++;
        }
      }
      
      if (convertedCount > 0) {
        figma.notify(`${convertedCount}개의 텍스트가 UX 친화적 톤으로 변환되었습니다! ✨`);
        
        // 변환 후 재분석
        const texts = textNodes.map(node => node.characters);
        const updatedProfile = generateUXToneProfile(texts);
        
        figma.ui.postMessage({
          type: 'conversion-complete',
          data: {
            convertedCount,
            updatedProfile
          }
        });
      } else {
        figma.notify('적용할 변환 규칙이 없습니다. 다른 텍스트를 선택해보세요! 🤔');
      }
    }
    
    if (msg.type === 'cancel') {
  figma.closePlugin();
    }
    
  } catch (error) {
    console.error('플러그인 실행 중 오류 발생:', error);
    figma.notify('오류가 발생했습니다. 다시 시도해주세요! ❌', { error: true });
  }
};
