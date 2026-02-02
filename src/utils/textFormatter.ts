/**
 * fullText를 마크다운 형식으로 변환하는 유틸리티
 */

/**
 * 박스 표를 마크다운 테이블로 변환하는 함수
 */
function convertBoxTableToMarkdown(boxTableLines: string[]): string {
  const tableRows: Array<[string, string]> = [];
  
  for (const line of boxTableLines) {
    const trimmedLine = line.trim();
    
    // 박스 테두리 라인 스킵 (┌, └, ├, ─ 또는 ─만 있는 라인, ├─┤ 형태)
    if (trimmedLine.match(/^[┌└├┤┬┴┼─]+$/)) {
      continue;
    }
    
    // 빈 줄 스킵
    if (trimmedLine === '') {
      continue;
    }
    
    // │로 구분된 셀 파싱
    // 형식: │ 라벨 │ 값
    // 또는: │ 라벨        │ 값 (공백으로 구분)
    if (trimmedLine.startsWith('│')) {
      // │를 기준으로 split 후 앞뒤 공백 제거
      const parts = trimmedLine.split('│').map(p => p.trim()).filter(p => p);
      
      // 모든 파트가 ─만 있는지 체크 (구분선 스킵)
      if (parts.every(p => p.match(/^─+$/))) {
        continue;
      }
      
      if (parts.length >= 2) {
        // 2개의 셀: 라벨 | 값
        const label = parts[0];
        const value = parts[1];
        tableRows.push([label, value]);
      } else if (parts.length === 1) {
        // 1개의 셀만 있으면, 공백으로 분리해서 마지막 단어를 값으로 사용
        const content = parts[0];
        const lastSpaceIndex = content.lastIndexOf('  '); // 2칸 이상 공백 찾기
        
        if (lastSpaceIndex !== -1) {
          const label = content.substring(0, lastSpaceIndex).trim();
          const value = content.substring(lastSpaceIndex).trim();
          tableRows.push([label, value]);
        }
      }
    }
  }

  if (tableRows.length === 0) {
    return '';
  }

  // 마크다운 테이블 생성
  const markdownTable: string[] = [];
  markdownTable.push('| 항목 | 내용 |');
  markdownTable.push('| --- | --- |');
  
  for (const [label, value] of tableRows) {
    markdownTable.push(`| ${label} | ${value} |`);
  }

  return '\n\n' + markdownTable.join('\n') + '\n\n';
}

export function convertToMarkdown(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. 【】로 감싸진 제목을 # 제목으로 변환 (앞뒤로 개행 추가)
  result = result.replace(/【(.+?)】/g, '\n# $1\n');

  // 2. "제N조 (제목)" 형식을 ### 제목으로 변환 (뒤에 개행 추가)
  result = result.replace(/^(제\d+조)\s*\((.+?)\)\s*$/gm, '\n### $1 $2\n');

  // 3. ━━━ 구분선을 --- 마크다운 구분선으로 변환
  result = result.replace(/^━{3,}$/gm, '\n---\n');

  // 4. ①, ②, ③ 등을  1. 2. 3. 으로 변환
  const circledNumbers: { [key: string]: number } = {
    '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
    '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
    '⑪': 11, '⑫': 12, '⑬': 13, '⑭': 14, '⑮': 15,
    '⑯': 16, '⑰': 17, '⑱': 18, '⑲': 19, '⑳': 20
  };

  // 각 줄을 처리
  const lines = result.split('\n');
  const processedLines: string[] = [];
  let inBoxTable = false;
  const boxTableLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 박스 표 시작 감지 (┌로 시작)
    if (trimmedLine.match(/^┌/)) {
      inBoxTable = true;
      boxTableLines.length = 0; // 초기화
      boxTableLines.push(line);
      continue;
    }
    
    // 박스 표 안에 있으면 모든 줄 수집
    if (inBoxTable) {
      boxTableLines.push(line);
      
      // 박스 표 끝 감지 (└로 시작)
      if (trimmedLine.match(/^└/)) {
        // 박스 표를 마크다운 테이블로 변환
        const tableMarkdown = convertBoxTableToMarkdown(boxTableLines);
        processedLines.push(tableMarkdown);
        
        inBoxTable = false;
        boxTableLines.length = 0;
      }
      continue;
    }
    
    // --- 구분선은 그대로 유지
    if (trimmedLine === '---') {
      processedLines.push(trimmedLine);
      continue;
    }
    
    // ■로 시작하는 줄 (볼드 처리)
    if (trimmedLine.match(/^■/)) {
      // ■ 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
      processedLines.push(`**${trimmedLine}**  `);
      continue;
    }
    
    // ※로 시작하는 줄 (들여쓰기 없이 바로 시작하는 경우)
    if (trimmedLine.match(/^※/) && !line.match(/^\s{2,}※/)) {
      // 각 ※ 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
      processedLines.push(`*${trimmedLine}*  `);
      continue;
    }
    
    // ▶로 시작하는 줄 처리
    if (trimmedLine.match(/^▶/)) {
      // 다음 줄들을 확인하여 들여쓰기된 목록이 있는지 체크
      const listItems: string[] = [];
      let j = i + 1;
      
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();
        
        // 들여쓰기된 - 목록
        if (nextLine.match(/^\s{1,}-\s/)) {
          listItems.push(nextTrimmed);
          j++;
        }
        // 들여쓰기된 ※ 텍스트
        else if (nextLine.match(/^\s{1,}※/)) {
          listItems.push(nextTrimmed);
          j++;
        }
        // 빈 줄이면 계속
        else if (nextTrimmed === '') {
          j++;
          // 빈 줄 이후에도 계속 목록이 있는지 체크하지 않고 종료
          break;
        }
        // 들여쓰기 목록 끝
        else {
          break;
        }
      }
      
      // 들여쓰기된 목록이 있으면 함께 처리
      if (listItems.length > 0) {
        processedLines.push('');
        processedLines.push(trimmedLine);
        processedLines.push('');
        processedLines.push(...listItems);
        processedLines.push('');
        i = j - 1; // 이미 처리한 줄들 스킵
      } 
      // 들여쓰기된 목록이 없으면 ✓, → 처럼 처리
      else {
        const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
        
        // 첫 번째 ▶ 항목이면 빈 줄 추가
        if (prevLine && !prevLine.trim().startsWith('▶')) {
          processedLines.push('');
        }
        
        // ▶ 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
        processedLines.push(trimmedLine + '  ');
      }
      continue;
    }
    
    // ✓로 시작하는 줄 처리 (연속된 체크리스트)
    if (trimmedLine.match(/^✓/)) {
      const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
      
      // 첫 번째 ✓ 항목이면 빈 줄 추가
      if (prevLine && !prevLine.trim().startsWith('✓')) {
        processedLines.push('');
      }
      
      // ✓ 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
      processedLines.push(trimmedLine + '  ');
      continue;
    }
    
    // ✅로 시작하는 줄 처리 (연속된 체크리스트)
    if (trimmedLine.match(/^✅/)) {
      const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
      
      // 첫 번째 ✅ 항목이면 빈 줄 추가
      if (prevLine && !prevLine.trim().startsWith('✅')) {
        processedLines.push('');
      }
      
      // ✅ 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
      processedLines.push(trimmedLine + '  ');
      continue;
    }
    
    // →로 시작하는 줄 처리 (연속된 화살표 목록)
    if (trimmedLine.match(/^→/)) {
      const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
      
      // 첫 번째 → 항목이면 빈 줄 추가
      if (prevLine && !prevLine.trim().startsWith('→')) {
        processedLines.push('');
      }
      
      // → 줄 끝에 두 개의 공백 추가 (마크다운 hard line break)
      processedLines.push(trimmedLine + '  ');
      continue;
    }
    
    // 콜론(:) 뒤에 따옴표나 특정 키워드가 있는 경우 개행 추가
    if (trimmedLine.match(/[:：]$/) && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // 따옴표로 시작하거나 "✓"로 시작하는 경우 개행
      if (nextLine.startsWith('"') || nextLine.startsWith('"') || nextLine.startsWith('「') || nextLine.startsWith('✓')) {
        processedLines.push(line);
        processedLines.push(''); // 빈 줄 추가하여 개행 효과
        continue;
      }
    }
    
    // ①, ②, ③ 등을 찾아서 번호 목록으로 변환
    let wasCircledNumber = false;
    for (const [symbol, number] of Object.entries(circledNumbers)) {
      if (trimmedLine.startsWith(symbol)) {
        // 이전 줄이 비어있지 않고, 제목이 아니고, 다른 목록도 아니면 빈 줄 추가
        const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
        if (prevLine && !prevLine.match(/^#+\s/) && !prevLine.match(/^\d+\.\s/) && prevLine.trim() !== '') {
          processedLines.push(''); // 빈 줄 추가
        }
        
        processedLines.push(trimmedLine.replace(new RegExp(`^${symbol}\\s*`), `${number}. `));
        wasCircledNumber = true;
        break;
      }
    }
    
    if (!wasCircledNumber) {
      // 일반 줄 처리
      // 숫자 목록 (1. 2. 3. 형식)
      if (trimmedLine.match(/^\d+\.\s/)) {
        const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
        const prevTrimmed = prevLine.trim();
        
        // 이전 줄이 제목이면 빈 줄 추가
        if (prevTrimmed.match(/^###\s/)) {
          processedLines.push(''); // 제목 뒤 목록 앞에 빈 줄
        }
        // "다음과 같이", "다음 내용", "다음 수수료" 등의 뒤에 오는 목록은 그대로
        else if (prevTrimmed.match(/[:：]$/) || prevTrimmed.match(/다음과?\s*(같이|내용|경우|수수료|정보|사항)/)) {
          // 빈 줄 추가 안 함
        }
        // 연속된 목록이 아닌 경우 빈 줄 추가
        else if (prevTrimmed && !prevTrimmed.match(/^[-*]\s/) && !prevTrimmed.match(/^\d+\.\s/) && 
                 !prevTrimmed.match(/^#+\s/) && prevTrimmed !== '' && !prevTrimmed.startsWith('<')) {
          processedLines.push(''); // 빈 줄 추가
        }
        
        processedLines.push(trimmedLine);
      }
      // 들여쓰기된 하이픈 목록
      else if (line.match(/^\s{2,}-\s/)) {
        processedLines.push('  ' + trimmedLine);
      }
      // 들여쓰기된 ※ 기호 처리
      else if (line.match(/^\s{2,}※/)) {
        processedLines.push(line);
      }
      // 하이픈 목록 (- 로 시작)
      else if (trimmedLine.match(/^-\s/)) {
        const prevLine = i > 0 ? processedLines[processedLines.length - 1] : '';
        const prevTrimmed = prevLine.trim();
        
        // 연속된 목록이 아닌 경우 빈 줄 추가
        if (prevTrimmed && !prevTrimmed.match(/^[-*]\s/) && !prevTrimmed.match(/^\d+\.\s/) && 
            !prevTrimmed.match(/^#+\s/) && !prevTrimmed.match(/[:：]$/) && prevTrimmed !== '' && 
            !prevTrimmed.startsWith('<')) {
          processedLines.push(''); // 빈 줄 추가
        }
        
        processedLines.push(trimmedLine);
      }
      else {
        processedLines.push(line);
      }
    }
  }

  result = processedLines.join('\n');

  // 연속된 빈 줄을 하나로 정리 (최대 2줄)
  result = result.replace(/\n{3,}/g, '\n\n');

  // 제목 앞뒤 공백 정리
  result = result.replace(/\n{2,}(#+\s.+)\n{2,}/g, '\n\n$1\n\n');
  
  // 제목 바로 뒤는 한 줄 개행만
  result = result.replace(/^(#+\s.+)\n{2,}/gm, '$1\n');

  // 목록 항목들 사이 불필요한 빈 줄 제거 (연속된 목록)
  result = result.replace(/(\d+\.\s+.+)\n\n(\d+\.\s+.+)/g, '$1\n$2');
  result = result.replace(/(-\s+.+)\n\n(-\s+.+)/g, '$1\n$2');

  return result.trim();
}