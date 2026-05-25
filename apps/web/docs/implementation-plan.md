# Implementation Plan

## Phase 1: Foundation (Weeks 1-2)

### Core Data Layer
- [ ] Set up TypeScript types (`types/core.ts`)
- [ ] Implement ID generation (ULID/UUID v7)
- [ ] Create base store interfaces

### Block System
- [ ] Implement block operations (CRUD)
- [ ] Create block registry system
- [ ] Build block rendering framework
- [ ] Implement nested block support

### Page Tree
- [ ] Build tree data structure
- [ ] Implement tree traversal
- [ ] Create sidebar component

## Phase 2: Editor (Weeks 3-4)

### Block Editor
- [ ] Build editable block components
  - [ ] Paragraph
  - [ ] Headings (1-3)
  - [ ] Lists (bullet, numbered, todo)
  - [ ] Toggle
  - [ ] Code block
  - [ ] Callout
- [ ] Implement slash commands
- [ ] Add keyboard navigation
- [ ] Build drag & drop

### Rich Text
- [ ] Implement inline formatting
- [ ] Add mentions (@page, @user, @date)
- [ ] Build link handling

## Phase 3: Database (Weeks 5-7)

### Schema System
- [ ] Property definition system
- [ ] Property type implementations
- [ ] Schema validation

### Database Core
- [ ] Database block component
- [ ] Page-to-row mapping
- [ ] Template system

### Views
- [ ] Table view
- [ ] Board view (Kanban)
- [ ] List view
- [ ] Gallery view
- [ ] Calendar view
- [ ] Timeline view

### Query Engine
- [ ] Filter system
- [ ] Sort system
- [ ] Group system
- [ ] Search integration

## Phase 4: Advanced Features (Weeks 8-9)

### Relations & Rollups
- [ ] Two-way relation sync
- [ ] Rollup calculations
- [ ] Formula evaluation

### Computed Properties
- [ ] Formula parser
- [ ] Built-in functions
- [ ] Property references

## Phase 5: Collaboration (Weeks 10-11)

### Real-time
- [ ] WebSocket setup
- [ ] CRDT implementation
- [ ] Operation transformation
- [ ] Awareness (cursors)

현재 구현 메모:
- 문서 공동 편집은 Yjs + awareness로 동작한다.
- 커서 awareness는 `user`, `cursor`(텍스트 caret/selection), `userCursor`(page/canvas/database 포인터)로 분리되어 있다.
- 클라이언트 세션은 4색 협업 커서 팔레트 중 하나를 랜덤 고정 선택한다.
- 문서에서는 같은 사용자에 대해 텍스트 caret와 페이지 포인터를 동시에 렌더링하지 않는다.

### Comments
- [ ] Comment data model
- [ ] Thread system
- [ ] UI components

## Phase 6: Graph & Search (Week 12)

### Backlinks
- [ ] Link extraction
- [ ] Backlink index
- [ ] UI panel

### Graph View
- [ ] Force-directed layout
- [ ] Node rendering
- [ ] Interactions

### Search
- [ ] Full-text index
- [ ] Search UI
- [ ] Filters

## Phase 7: Polish (Week 13+)

### Performance
- [ ] Virtualization
- [ ] Lazy loading
- [ ] Caching

### Offline
- [ ] IndexedDB sync
- [ ] Conflict resolution

### Polish
- [ ] Animations
- [ ] Mobile support
- [ ] Accessibility

---

## Architecture Decisions

### State Management
- **Zustand** for client state
- **TanStack Query** for server state
- **Yjs** or custom CRDT for real-time

### Database
- **PostgreSQL** for structured data
- **Redis** for real-time sessions
- **Elasticsearch** for search (optional)

### Real-time
- **Socket.io** or native WebSocket
- **Operational Transformation** for text
- **CRDT** for block structure

### Frontend
- **Next.js** with App Router
- **Tailwind CSS** for styling
- **Framer Motion** for animations

---

## File Structure

```
app/
├── api/                    # API routes
├── workspace/
│   └── [workspaceId]/
│       ├── page.tsx        # Workspace page
│       └── graph/
├── page/
│   └── [pageId]/
│       └── page.tsx        # Page editor
components/
├── blocks/                 # Block components
│   ├── BlockRenderer.tsx
│   ├── TextBlock.tsx
│   ├── DatabaseBlock.tsx
│   └── ...
├── database/               # Database views
│   ├── TableView.tsx
│   ├── BoardView.tsx
│   └── ...
├── editor/                 # Editor components
│   ├── BlockEditor.tsx
│   ├── SlashCommand.tsx
│   └── ...
├── sidebar/
│   └── PageTree.tsx
lib/
├── database/
│   └── queryEngine.ts
├── collaboration/
│   └── crdt.ts
├── graph/
│   └── backlinks.ts
├── stores/
│   ├── pageStore.ts
│   ├── blockStore.ts
│   └── databaseStore.ts
└── hooks/
    ├── usePage.ts
    ├── useBlocks.ts
    └── useDatabase.ts
types/
└── core.ts
```

---

## Key Technical Challenges

1. **Block Nesting Performance**
   - Virtualize deeply nested trees
   - Lazy load children

2. **Real-time Sync**
   - Handle concurrent edits
   - Resolve conflicts gracefully

3. **Database Query Performance**
   - Cache computed properties
   - Incremental updates

4. **Formula Evaluation**
   - Sandboxed execution
   - Dependency tracking

5. **Mobile Experience**
   - Touch-friendly interactions
   - Responsive layouts
