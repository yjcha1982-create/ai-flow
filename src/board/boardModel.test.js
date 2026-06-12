import {
  CURRENT_USER,
  createComment,
  createInitialBoardData,
  createPost,
  getCommentTree,
  listPosts,
  updatePost,
  validatePostInput,
} from './boardModel';

describe('board model', () => {
  test('게시글 입력을 검증한다', () => {
    expect(validatePostInput({ title: ' ', content: '' }).valid).toBe(false);
    expect(validatePostInput({ title: '제목', content: '내용' }).valid).toBe(true);
  });

  test('게시글을 검색하고 최신순으로 페이지 처리한다', () => {
    const data = createInitialBoardData();
    const result = listPosts(data, { keyword: 'Flow', page: 1 });
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts[0].title).toContain('Flow');
  });

  test('작성자만 게시글을 수정할 수 있다', () => {
    const data = createInitialBoardData();
    const denied = updatePost(data, 'post-design', { title: '수정', content: '수정 내용' }, CURRENT_USER);
    const allowed = updatePost(data, 'post-welcome', { title: '수정', content: '수정 내용' }, CURRENT_USER);
    expect(denied.ok).toBe(false);
    expect(allowed.ok).toBe(true);
  });

  test('게시글을 생성한다', () => {
    const data = createInitialBoardData();
    const result = createPost(data, { title: '새 글', content: '새 내용' });
    expect(result.ok).toBe(true);
    expect(result.data.posts[0].authorId).toBe(CURRENT_USER.id);
  });

  test('대댓글 깊이를 한 단계로 제한한다', () => {
    const data = createInitialBoardData();
    const nested = createComment(data, {
      postId: 'post-welcome',
      parentCommentId: 'comment-2',
      content: '허용되지 않는 깊이',
    });
    expect(nested.ok).toBe(false);
  });

  test('댓글 트리를 한 단계로 구성한다', () => {
    const tree = getCommentTree(createInitialBoardData(), 'post-welcome');
    expect(tree[0].replies).toHaveLength(1);
  });
});
