#  Obnofi Design System

> 디자인 철학: **조용한 도구(Quiet Tool)** — 콘텐츠가 주인공이 되고, 인터페이스는 뒤로 물러난다.

> 🎨 **브랜드 포인트 컬러**: `#2E7D45` (로고 그린) — 강조, CTA, 포커스 링에 일관되게 사용한다.

---

## 1. 디자인 철학 (Design Philosophy)

obnofi는 **편집기 우선(Editor-first)** 디자인을 추구한다. 모든 UI 결정은 아래 원칙을 따른다:

- **최소 간섭 (Minimum Interference)** — 툴바, 버튼, 장식 요소는 사용자가 집중할 때 사라진다.
- **블록 기반 (Block-based Thinking)** — 모든 콘텐츠는 독립적인 블록 단위로 구성된다.
- **유연한 구조 (Flexible Structure)** — 같은 데이터를 표, 칸반, 갤러리, 캘린더 등 다양한 뷰로 전환할 수 있다.
- **조용한 색상 (Subdued Color)** — 색상은 강조가 아닌 분류와 상태 표시에만 사용된다.

---

## 2. 색상 시스템 (Color System)

### 기본 팔레트

| 토큰명 | 용도 | Light Mode | Dark Mode |
|---|---|---|---|
| `--color-background` | 페이지 배경 | `#FFFFFF` | `#191919` |
| `--color-surface` | 사이드바, 패널 | `#F7F7F5` | `#202020` |
| `--color-hover` | 호버 상태 배경 | `#EBEBEA` | `#2F2F2F` |
| `--color-border` | 구분선, 테두리 | `#E3E2E0` | `#373737` |
| `--color-text-primary` | 본문 텍스트 | `#37352F` | `#FFFCED` |
| `--color-text-secondary` | 설명, 힌트 텍스트 | `#787774` | `#7F7F7F` |
| `--color-text-placeholder` | 플레이스홀더 | `#C7C6C4` | `#4A4A4A` |
| `--color-accent` | 강조, CTA 버튼 (로고 그린) | `#2E7D45` | `#3DA05A` |
| `--color-accent-hover` | 강조 버튼 호버 | `#246138` | `#2E7D45` |
| `--color-accent-subtle` | 강조 배경 (연한 그린) | `#E8F5EC` | `#1A3327` |

### 텍스트 하이라이트 & 배경 컬러 (7가지)

obnofi는 7가지 의미론적 색상을 제공한다. 각각 텍스트 색상과 배경 색상(연한 버전)으로 쌍을 이룬다.

| 이름 | 텍스트 | 배경 |
|---|---|---|
| Default | `#37352F` | `#F7F7F5` |
| Gray | `#9B9A97` | `#EBECED` |
| Brown | `#64473A` | `#E9E5E3` |
| Orange | `#D9730D` | `#FAEBDD` |
| Yellow | `#CB912F` | `#FBF3DB` |
| Green | `#448361` | `#DDedea` |
| Blue | `#337EA9` | `#DDEBF1` |
| Purple | `#9065B0` | `#EAE4F2` |
| Pink | `#C14C8A` | `#F4DFEB` |
| Red | `#D44C47` | `#FDDEDE` |

---

## 3. 타이포그래피 (Typography)

obnofi는 시스템 폰트 스택을 사용해 운영체제별 최적 가독성을 제공한다.

```css
font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Helvetica, "Apple Color Emoji", Arial,
  sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
```

### 텍스트 스케일

| 용도 | 크기 | 굵기 | 줄 높이 |
|---|---|---|---|
| H1 (제목 1) | `40px` (2em) | `700` | `1.2` |
| H2 (제목 2) | `30px` (1.875em) | `600` | `1.3` |
| H3 (제목 3) | `24px` (1.25em) | `600` | `1.3` |
| Body (본문) | `16px` | `400` | `1.5` |
| Small | `14px` | `400` | `1.4` |
| Caption | `12px` | `400` | `1.4` |
| Code | `85%` (em) | `400` | `1.5` |

### 폰트 규칙

- 본문은 기본적으로 `16px`, 소형 화면에서는 `14px`
- 줄 길이(line length)는 최대 `65ch`로 제한 (가독성 최적화)
- `font-weight`는 400(기본)과 600(강조) 두 가지만 주로 사용
- 코드 폰트: `"SFMono-Regular", Menlo, Consolas, monospace`

---

## 4. 간격 & 레이아웃 (Spacing & Layout)

### 8pt 그리드 시스템

obnofi는 `4px` 베이스 유닛을 사용한다. 모든 간격은 4의 배수.

| 토큰 | 값 | 용도 |
|---|---|---|
| `space-1` | `4px` | 아이콘 내부 패딩 |
| `space-2` | `8px` | 버튼 내부 패딩 (상하) |
| `space-3` | `12px` | 인라인 요소 간격 |
| `space-4` | `16px` | 블록 간 기본 간격 |
| `space-6` | `24px` | 섹션 내 간격 |
| `space-8` | `32px` | 섹션 간 간격 |
| `space-12` | `48px` | 페이지 상단 여백 |

### 페이지 레이아웃

```
┌────────────────────────────────────────────┐
│  Sidebar (240px)  │    Content Area        │
│                   │  max-width: 900px      │
│  - 워크스페이스    │  padding: 96px 96px    │
│  - 페이지 목록    │                        │
│  - 즐겨찾기       │   [Title]              │
│                   │   [Cover / Icon]       │
│                   │   [Blocks...]          │
└────────────────────────────────────────────┘
```

- 사이드바 너비: `240px` (기본), 접기 시 `0px`
- 콘텐츠 최대 너비: `900px` (일반), `1200px` (전체 너비 옵션)
- 페이지 좌우 패딩: `96px` (데스크탑), `24px` (모바일)

---

## 5. 컴포넌트 (Components)

### 5.1 블록 (Block)

obnofi의 핵심 단위. 모든 콘텐츠는 블록으로 구성된다.

```
[⠿] [📝] 텍스트 내용이 여기 들어갑니다...
 ↑    ↑
드래그  블록 타입 아이콘
핸들
```

- 호버 시 왼쪽에 드래그 핸들(`⠿`)과 `+` 버튼 표시
- 블록 선택 시 배경색 `--color-hover` 적용
- 블록 타입: Paragraph, Heading, Bulleted List, Numbered List, Toggle, Quote, Callout, Code, Divider, Table, Database 등

### 5.2 버튼 (Button)

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent);        /* #2E7D45 — 로고 그린 */
  color: #FFFFFF;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 120ms ease;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  padding: 6px 12px;
}
.btn-ghost:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}
```

### 5.3 사이드바 아이템

```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}
.sidebar-item:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}
.sidebar-item.active {
  background: var(--color-hover);
  color: var(--color-text-primary);
  font-weight: 500;
}
```

### 5.4 툴팁 & 팝오버

- 배경: `#1F1F1E` (다크, 라이트 모드 모두 동일)
- 텍스트: `#FFFFFF`
- border-radius: `6px`
- 패딩: `6px 10px`
- 폰트 크기: `12px`
- 애니메이션: `fadeIn 80ms ease`

### 5.5 Callout 블록

```css
.callout {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 4px;
  background: var(--color-surface);
  border-left: none; /* obnofi는 border-left 없이 배경색만 사용 */
}
.callout-icon {
  font-size: 20px;
  flex-shrink: 0;
}
```

---

## 6. 아이콘 시스템 (Icon System)

- 아이콘 크기: `16px` (기본), `20px` (블록 타입), `24px` (이모지 아이콘)
- obnofi는 이모지를 페이지 아이콘으로 광범위하게 활용
- 커스텀 SVG 아이콘은 `currentColor`로 색상 상속
- 아이콘 색상: `--color-text-secondary` (기본), 호버 시 `--color-text-primary`

---

## 7. 모션 & 인터랙션 (Motion & Interaction)

### 원칙

obnofi의 애니메이션은 **기능적 목적**에만 존재한다. 장식적 애니메이션은 사용하지 않는다.

| 상황 | Duration | Easing |
|---|---|---|
| 버튼 hover | `120ms` | `ease` |
| 사이드바 열기/닫기 | `200ms` | `ease-in-out` |
| 모달 등장 | `180ms` | `ease-out` |
| 드롭다운 | `120ms` | `ease-out` |
| 페이지 전환 | `없음 (instant)` | — |
| 블록 드래그 | `실시간` | `cubic-bezier(0.2, 0, 0, 1)` |

### 슬래시 커맨드 (`/`)

- 타이핑 즉시 팝오버 등장 (지연 없음)
- 검색 결과 필터링: `debounce 0ms` (실시간)
- 선택 항목 이동: 키보드 화살표 지원

---

## 8. 반응형 디자인 (Responsive Design)

| 브레이크포인트 | 범위 | 변경사항 |
|---|---|---|
| Desktop | `> 1024px` | 사이드바 상시 표시 |
| Tablet | `768px ~ 1024px` | 사이드바 오버레이로 전환 |
| Mobile | `< 768px` | 사이드바 숨김, 하단 탐색 바 |

### 모바일 특이사항
- 페이지 패딩: `24px`
- 블록 드래그&드롭 비활성화 (탭&홀드 대체)
- 슬래시 커맨드는 키보드 툴바로 접근

---

## 9. 다크 모드 (Dark Mode)

obnofi 다크 모드는 단순 색상 반전이 아닌, **별도 설계된 팔레트**를 사용한다.

### 다크 모드 설계 원칙

- 배경은 순수 검정(`#000`) 대신 따뜻한 짙은 회색(`#191919`) 사용 → 눈부심 방지
- 텍스트는 순수 흰색 대신 크림색(`#FFFCED`) 사용 → 눈 피로 감소
- 경계선은 명도 대비를 낮춰 부드럽게 처리
- 포인트 컬러(그린)는 다크 배경에서 명도를 높여 가독성 확보 (`#3DA05A`)
- 강조 배경(subtle)은 짙은 초록 계열(`#1A3327`)로 대체

### 다크 모드 색상 토큰

| 토큰명 | 라이트 모드 | 다크 모드 | 변경 이유 |
|---|---|---|---|
| `--color-background` | `#FFFFFF` | `#191919` | 따뜻한 다크 배경 |
| `--color-surface` | `#F7F7F5` | `#202020` | 사이드바/패널 구분 |
| `--color-hover` | `#EBEBEA` | `#2F2F2F` | 호버 피드백 유지 |
| `--color-selected` | `#E7E7E6` | `#383838` | 선택 블록 강조 |
| `--color-border` | `#E3E2E0` | `#373737` | 낮은 대비 구분선 |
| `--color-text-primary` | `#37352F` | `#FFFCED` | 크림 화이트 — 눈 피로 감소 |
| `--color-text-secondary` | `#787774` | `#7F7F7F` | 보조 텍스트 |
| `--color-text-placeholder` | `#C7C6C4` | `#4A4A4A` | 플레이스홀더 |
| `--color-accent` | `#2E7D45` | `#3DA05A` | 밝기 올려 대비 확보 |
| `--color-accent-hover` | `#246138` | `#2E7D45` | 호버 시 원색으로 |
| `--color-accent-subtle` | `#E8F5EC` | `#1A3327` | 강조 배경 (짙은 그린) |
| `--color-tooltip-bg` | `#1F1F1E` | `#111111` | 툴팁 배경 |

### 다크 모드 하이라이트 컬러

다크 모드에서는 텍스트 하이라이트 색상도 전체적으로 채도를 낮추고 밝기를 조정한다.

| 이름 | 텍스트 (다크) | 배경 (다크) |
|---|---|---|
| Default | `#FFFCED` | `#2F2F2F` |
| Gray | `#9B9A97` | `#2E2E2E` |
| Brown | `#937264` | `#2E2521` |
| Orange | `#FFA344` | `#3D2514` |
| Yellow | `#FFDC49` | `#3B2F00` |
| Green | `#4DAB9A` | `#0F2926` |
| Blue | `#529CCA` | `#102942` |
| Purple | `#9A6DD7` | `#1F1535` |
| Pink | `#E255A1` | `#35152A` |
| Red | `#FF7369` | `#3D0F0E` |

### CSS 구현

```css
/* 시스템 설정 자동 감지 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background:       #191919;
    --color-surface:          #202020;
    --color-hover:            #2F2F2F;
    --color-selected:         #383838;
    --color-border:           #373737;
    --color-text-primary:     #FFFCED;
    --color-text-secondary:   #7F7F7F;
    --color-text-placeholder: #4A4A4A;
    --color-accent:           #3DA05A;
    --color-accent-hover:     #2E7D45;
    --color-accent-subtle:    #1A3327;
    --color-tooltip-bg:       #111111;
  }
}

/* 수동 토글 — [data-theme="dark"] 클래스 */
[data-theme="dark"] {
  --color-background:       #191919;
  --color-surface:          #202020;
  --color-hover:            #2F2F2F;
  --color-selected:         #383838;
  --color-border:           #373737;
  --color-text-primary:     #FFFCED;
  --color-text-secondary:   #7F7F7F;
  --color-text-placeholder: #4A4A4A;
  --color-accent:           #3DA05A;
  --color-accent-hover:     #2E7D45;
  --color-accent-subtle:    #1A3327;
  --color-tooltip-bg:       #111111;
}

/* 수동 토글 — [data-theme="light"] 클래스 */
[data-theme="light"] {
  --color-background:       #FFFFFF;
  --color-surface:          #F7F7F5;
  --color-hover:            #EBEBEA;
  --color-selected:         #E7E7E6;
  --color-border:           #E3E2E0;
  --color-text-primary:     #37352F;
  --color-text-secondary:   #787774;
  --color-text-placeholder: #C7C6C4;
  --color-accent:           #2E7D45;
  --color-accent-hover:     #246138;
  --color-accent-subtle:    #E8F5EC;
  --color-tooltip-bg:       #1F1F1E;
}
```

### 다크 모드 전환 애니메이션

```css
/* 테마 전환 시 부드럽게 */
*, *::before, *::after {
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    color 150ms ease;
}

/* 단, 성능 민감 요소는 제외 */
.block-drag-handle,
.no-transition {
  transition: none !important;
}
```

---

## 10. 접근성 (Accessibility)

- **키보드 내비게이션** 완전 지원 (Tab, Arrow, Enter, Escape)
- **포커스 링**: `outline: 2px solid var(--color-accent)` → `#2E7D45` (로고 그린, 기본 outline 제거 후 커스텀)
- **색상 대비**: WCAG AA 기준 충족 (4.5:1 이상)
- **aria-label**: 모든 아이콘 버튼에 필수 적용
- **스크린 리더**: 블록 타입 변경 시 `aria-live` 알림

---

## 11. 디자인 토큰 요약 (CSS Custom Properties)

```css
/* ===== Light Mode (Default) ===== */
:root {
  /* Colors — Brand */
  --color-accent:           #2E7D45;   /* 로고 그린 — 포인트 컬러 */
  --color-accent-hover:     #246138;
  --color-accent-subtle:    #E8F5EC;   /* 강조 배경 (연한 그린) */

  /* Colors — Base */
  --color-background:       #FFFFFF;
  --color-surface:          #F7F7F5;
  --color-hover:            #EBEBEA;
  --color-selected:         #E7E7E6;
  --color-border:           #E3E2E0;

  /* Colors — Text */
  --color-text-primary:     #37352F;
  --color-text-secondary:   #787774;
  --color-text-placeholder: #C7C6C4;

  /* Colors — UI */
  --color-tooltip-bg:       #1F1F1E;

  /* Typography */
  --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Menlo, Consolas, monospace;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease-in-out;

  /* Layout */
  --sidebar-width:      240px;
  --content-max-width:  900px;
  --page-padding:       96px;
}

/* ===== Dark Mode ===== */
@media (prefers-color-scheme: dark) {
  :root {
    --color-accent:           #3DA05A;
    --color-accent-hover:     #2E7D45;
    --color-accent-subtle:    #1A3327;
    --color-background:       #191919;
    --color-surface:          #202020;
    --color-hover:            #2F2F2F;
    --color-selected:         #383838;
    --color-border:           #373737;
    --color-text-primary:     #FFFCED;
    --color-text-secondary:   #7F7F7F;
    --color-text-placeholder: #4A4A4A;
    --color-tooltip-bg:       #111111;
  }
}
```
