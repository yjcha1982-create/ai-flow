export const BOARD_STORAGE_KEY = 'ai-flow-board-data';
export const CURRENT_USER = { id: 'user-kim', name: '김하늘' };
export const PAGE_SIZE = 10;

const initialData = {
  posts: [
    {
      id: 'post-welcome',
      title: 'AI Flow로 만든 첫 번째 게시글입니다',
      content:
        '이 게시판은 게시글 목록, 상세 읽기, 작성, 수정, 댓글과 대댓글 Flow를 기준으로 구현했습니다.\n\n직접 글과 댓글을 남겨 기능을 확인해 보세요.',
      authorId: 'user-kim',
      authorName: '김하늘',
      createdAt: '2026-06-12T08:00:00.000Z',
      updatedAt: '2026-06-12T08:00:00.000Z',
    },
    {
      id: 'post-design',
      title: '좋은 Flow는 구현 전에 오해를 보여줍니다',
      content:
        '자연어 요청을 바로 개발하는 대신 Box와 관계로 먼저 구조화하면 누락된 조건과 권한을 더 일찍 발견할 수 있습니다.',
      authorId: 'user-lee',
      authorName: '이서준',
      createdAt: '2026-06-11T10:30:00.000Z',
      updatedAt: '2026-06-11T10:30:00.000Z',
    },
    {
      id: 'post-comments',
      title: '댓글과 대댓글 테스트 안내',
      content:
        '댓글은 게시글 아래에 표시되고, 대댓글은 댓글 아래 한 단계까지만 작성할 수 있습니다.',
      authorId: 'user-park',
      authorName: '박지민',
      createdAt: '2026-06-10T03:15:00.000Z',
      updatedAt: '2026-06-10T03:15:00.000Z',
    },
  ],
  comments: [
    {
      id: 'comment-1',
      postId: 'post-welcome',
      parentCommentId: null,
      content: 'Flow JSON과 실제 결과를 비교하기 좋네요.',
      authorId: 'user-lee',
      authorName: '이서준',
      createdAt: '2026-06-12T08:20:00.000Z',
    },
    {
      id: 'comment-2',
      postId: 'post-welcome',
      parentCommentId: 'comment-1',
      content: '대댓글도 한 단계로 잘 보입니다.',
      authorId: 'user-kim',
      authorName: '김하늘',
      createdAt: '2026-06-12T08:25:00.000Z',
    },
  ],
};

export function createInitialBoardData() {
  return JSON.parse(JSON.stringify(initialData));
}

export function loadBoardData() {
  const raw = localStorage.getItem(BOARD_STORAGE_KEY);
  if (!raw) return createInitialBoardData();

  try {
    return normalizeBoardData(JSON.parse(raw));
  } catch {
    return createInitialBoardData();
  }
}

export function saveBoardData(data) {
  localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(data));
}

export function resetBoardData() {
  const data = createInitialBoardData();
  saveBoardData(data);
  return data;
}

export function normalizeBoardData(data) {
  return {
    posts: Array.isArray(data?.posts) ? data.posts : [],
    comments: Array.isArray(data?.comments) ? data.comments : [],
  };
}

export function validatePostInput({ title = '', content = '' }) {
  const normalized = {
    title: title.trim(),
    content: content.trim(),
  };
  const errors = {};

  if (!normalized.title) errors.title = '제목을 입력해 주세요.';
  else if (normalized.title.length > 100) errors.title = '제목은 100자 이하여야 합니다.';

  if (!normalized.content) errors.content = '내용을 입력해 주세요.';
  else if (normalized.content.length > 10000) errors.content = '내용은 10,000자 이하여야 합니다.';

  return { valid: Object.keys(errors).length === 0, errors, value: normalized };
}

export function validateCommentInput(content = '') {
  const value = content.trim();
  if (!value) return { valid: false, error: '댓글 내용을 입력해 주세요.', value };
  if (value.length > 1000) return { valid: false, error: '댓글은 1,000자 이하여야 합니다.', value };
  return { valid: true, error: '', value };
}

export function listPosts(data, { keyword = '', page = 1, pageSize = PAGE_SIZE } = {}) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  const filtered = data.posts
    .filter((post) => {
      if (!normalizedKeyword) return true;
      return [post.title, post.content, post.authorName]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedKeyword);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    posts: filtered.slice(start, start + pageSize),
    totalCount,
    totalPages,
    currentPage,
  };
}

export function getPost(data, postId) {
  return data.posts.find((post) => post.id === postId) || null;
}

export function getCommentTree(data, postId) {
  const comments = data.comments
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const roots = comments
    .filter((comment) => !comment.parentCommentId)
    .map((comment) => ({ ...comment, replies: [] }));
  const rootMap = new Map(roots.map((comment) => [comment.id, comment]));

  comments
    .filter((comment) => comment.parentCommentId)
    .forEach((comment) => {
      const parent = rootMap.get(comment.parentCommentId);
      if (parent) parent.replies.push({ ...comment, replies: [] });
    });

  return roots;
}

export function createPost(data, input, user = CURRENT_USER) {
  const validation = validatePostInput(input);
  if (!validation.valid) return { ok: false, errors: validation.errors, data };

  const now = new Date().toISOString();
  const post = {
    id: makeId('post'),
    ...validation.value,
    authorId: user.id,
    authorName: user.name,
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, post, data: { ...data, posts: [post, ...data.posts] } };
}

export function updatePost(data, postId, input, user = CURRENT_USER) {
  const post = getPost(data, postId);
  if (!post) return { ok: false, message: '수정할 게시글을 찾을 수 없습니다.', data };
  if (post.authorId !== user.id) return { ok: false, message: '작성자만 게시글을 수정할 수 있습니다.', data };

  const validation = validatePostInput(input);
  if (!validation.valid) return { ok: false, errors: validation.errors, data };

  const updated = {
    ...post,
    ...validation.value,
    updatedAt: new Date().toISOString(),
  };
  return {
    ok: true,
    post: updated,
    data: {
      ...data,
      posts: data.posts.map((item) => (item.id === postId ? updated : item)),
    },
  };
}

export function createComment(data, { postId, content, parentCommentId = null }, user = CURRENT_USER) {
  const post = getPost(data, postId);
  if (!post) return { ok: false, message: '댓글을 작성할 게시글이 없습니다.', data };

  const validation = validateCommentInput(content);
  if (!validation.valid) return { ok: false, message: validation.error, data };

  if (parentCommentId) {
    const parent = data.comments.find((comment) => comment.id === parentCommentId);
    if (!parent || parent.postId !== postId) {
      return { ok: false, message: '부모 댓글을 찾을 수 없습니다.', data };
    }
    if (parent.parentCommentId) {
      return { ok: false, message: '대댓글에는 다시 대댓글을 작성할 수 없습니다.', data };
    }
  }

  const comment = {
    id: makeId('comment'),
    postId,
    parentCommentId,
    content: validation.value,
    authorId: user.id,
    authorName: user.name,
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    comment,
    data: { ...data, comments: [...data.comments, comment] },
  };
}

export function getCommentCount(data, postId) {
  return data.comments.filter((comment) => comment.postId === postId).length;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
