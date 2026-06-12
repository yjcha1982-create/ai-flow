import React, { useEffect, useMemo, useState } from 'react';
import {
  CURRENT_USER,
  createComment,
  createPost,
  getCommentCount,
  getCommentTree,
  getPost,
  listPosts,
  loadBoardData,
  resetBoardData,
  saveBoardData,
  updatePost,
} from './boardModel';
import './board.css';

const initialRoute = { name: 'list', postId: null };

export default function BoardApp() {
  const [data, setData] = useState(loadBoardData);
  const [route, setRoute] = useState(initialRoute);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');

  useEffect(() => saveBoardData(data), [data]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Flow Board';
    return () => {
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const navigate = (name, postId = null) => {
    setRoute({ name, postId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    if (!window.confirm('게시판 데이터를 초기 샘플로 되돌릴까요?')) return;
    setData(resetBoardData());
    setKeyword('');
    setSearchInput('');
    setPage(1);
    navigate('list');
    setNotice('샘플 데이터를 복원했습니다.');
  };

  return (
    <div className="board-app">
      <BoardHeader
        onHome={() => navigate('list')}
        onWrite={() => navigate('create')}
        onReset={handleReset}
      />
      <main className="board-shell">
        {route.name === 'list' && (
          <PostList
            data={data}
            keyword={keyword}
            searchInput={searchInput}
            page={page}
            onSearchInput={setSearchInput}
            onSearch={() => {
              setKeyword(searchInput.trim());
              setPage(1);
            }}
            onClearSearch={() => {
              setSearchInput('');
              setKeyword('');
              setPage(1);
            }}
            onPage={setPage}
            onOpen={(postId) => navigate('detail', postId)}
            onWrite={() => navigate('create')}
          />
        )}
        {route.name === 'detail' && (
          <PostDetail
            data={data}
            postId={route.postId}
            onBack={() => navigate('list')}
            onEdit={() => navigate('edit', route.postId)}
            onChangeData={setData}
            onNotice={setNotice}
          />
        )}
        {(route.name === 'create' || route.name === 'edit') && (
          <PostEditor
            data={data}
            postId={route.name === 'edit' ? route.postId : null}
            onCancel={() =>
              route.name === 'edit'
                ? navigate('detail', route.postId)
                : navigate('list')
            }
            onSaved={(nextData, post) => {
              setData(nextData);
              setNotice(route.name === 'edit' ? '게시글을 수정했습니다.' : '게시글을 작성했습니다.');
              navigate('detail', post.id);
            }}
          />
        )}
      </main>
      {notice && <div className="board-toast">{notice}</div>}
    </div>
  );
}

function BoardHeader({ onHome, onWrite, onReset }) {
  return (
    <header className="board-header">
      <button className="board-brand" type="button" onClick={onHome}>
        <span>AF</span>
        <div>
          <strong>Flow Board</strong>
          <small>게시글 · 댓글 · 대댓글</small>
        </div>
      </button>
      <nav>
        <a href="/">Flow Studio</a>
        <button type="button" onClick={onReset}>샘플 초기화</button>
        <button className="board-primary" type="button" onClick={onWrite}>글쓰기</button>
      </nav>
    </header>
  );
}

function PostList({
  data,
  keyword,
  searchInput,
  page,
  onSearchInput,
  onSearch,
  onClearSearch,
  onPage,
  onOpen,
  onWrite,
}) {
  const result = useMemo(
    () => listPosts(data, { keyword, page }),
    [data, keyword, page],
  );

  useEffect(() => {
    if (page !== result.currentPage) onPage(result.currentPage);
  }, [onPage, page, result.currentPage]);

  return (
    <>
      <section className="board-hero">
        <div>
          <p className="board-kicker">COMMUNITY</p>
          <h1>생각을 쓰고, 대화를 이어가세요.</h1>
          <p>Flow JSON에서 정의한 목록, 읽기, 편집, 댓글 흐름을 실제로 구현한 샘플입니다.</p>
        </div>
        <div className="board-user-card">
          <span>현재 사용자</span>
          <strong>{CURRENT_USER.name}</strong>
          <small>내가 작성한 글만 수정할 수 있습니다.</small>
        </div>
      </section>

      <section className="board-panel">
        <div className="board-list-head">
          <div>
            <h2>게시글</h2>
            <span>{keyword ? `'${keyword}' 검색 결과 ${result.totalCount}개` : `전체 ${result.totalCount}개`}</span>
          </div>
          <form
            className="board-search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
          >
            <input
              value={searchInput}
              onChange={(event) => onSearchInput(event.target.value)}
              placeholder="제목, 내용, 작성자 검색"
            />
            {keyword && <button type="button" onClick={onClearSearch}>초기화</button>}
            <button className="board-primary" type="submit">검색</button>
          </form>
        </div>

        {result.posts.length ? (
          <div className="post-list">
            {result.posts.map((post) => (
              <button className="post-row" key={post.id} type="button" onClick={() => onOpen(post.id)}>
                <div className="post-row-main">
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                </div>
                <div className="post-row-meta">
                  <span>{post.authorName}</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <strong>댓글 {getCommentCount(data, post.id)}</strong>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="board-empty">
            <strong>표시할 게시글이 없습니다.</strong>
            <p>{keyword ? '다른 검색어를 입력하거나 전체 목록으로 돌아가세요.' : '첫 게시글을 작성해 보세요.'}</p>
            <button className="board-primary" type="button" onClick={keyword ? onClearSearch : onWrite}>
              {keyword ? '전체 목록' : '글쓰기'}
            </button>
          </div>
        )}

        {result.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                className={number === result.currentPage ? 'active' : ''}
                type="button"
                onClick={() => onPage(number)}
              >
                {number}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PostDetail({ data, postId, onBack, onEdit, onChangeData, onNotice }) {
  const post = getPost(data, postId);
  const commentTree = useMemo(() => getCommentTree(data, postId), [data, postId]);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');

  if (!post) {
    return (
      <section className="board-panel board-not-found">
        <span>404</span>
        <h1>게시글을 찾을 수 없습니다.</h1>
        <p>삭제되었거나 잘못된 주소의 게시글입니다.</p>
        <button className="board-primary" type="button" onClick={onBack}>목록으로</button>
      </section>
    );
  }

  const submitComment = (parentCommentId = null) => {
    const value = parentCommentId ? reply : comment;
    const result = createComment(data, { postId, content: value, parentCommentId });
    if (!result.ok) {
      if (parentCommentId) setReplyError(result.message);
      else setCommentError(result.message);
      return;
    }
    onChangeData(result.data);
    if (parentCommentId) {
      setReply('');
      setReplyError('');
      setReplyTo(null);
      onNotice('대댓글을 작성했습니다.');
    } else {
      setComment('');
      setCommentError('');
      onNotice('댓글을 작성했습니다.');
    }
  };

  return (
    <>
      <section className="board-panel post-detail">
        <div className="detail-toolbar">
          <button type="button" onClick={onBack}>← 목록</button>
          {post.authorId === CURRENT_USER.id && (
            <button className="board-primary" type="button" onClick={onEdit}>수정</button>
          )}
        </div>
        <div className="post-detail-head">
          <span className="post-category">BOARD</span>
          <h1>{post.title}</h1>
          <div>
            <strong>{post.authorName}</strong>
            <span>{formatDate(post.createdAt)}</span>
            {post.updatedAt !== post.createdAt && <span>수정 {formatDate(post.updatedAt)}</span>}
          </div>
        </div>
        <div className="post-content">{post.content}</div>
      </section>

      <section className="board-panel comments-panel">
        <div className="comments-heading">
          <h2>댓글</h2>
          <span>{getCommentCount(data, postId)}개</span>
        </div>
        <CommentForm
          value={comment}
          error={commentError}
          placeholder="댓글을 입력하세요."
          buttonLabel="댓글 작성"
          onChange={(value) => {
            setComment(value);
            setCommentError('');
          }}
          onSubmit={() => submitComment()}
        />

        <div className="comment-list">
          {commentTree.length ? (
            commentTree.map((item) => (
              <article className="comment-thread" key={item.id}>
                <CommentCard comment={item}>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(replyTo === item.id ? null : item.id);
                      setReply('');
                      setReplyError('');
                    }}
                  >
                    답글
                  </button>
                </CommentCard>
                {replyTo === item.id && (
                  <div className="reply-form">
                    <CommentForm
                      value={reply}
                      error={replyError}
                      placeholder={`${item.authorName}님 댓글에 답글`}
                      buttonLabel="대댓글 작성"
                      onChange={(value) => {
                        setReply(value);
                        setReplyError('');
                      }}
                      onSubmit={() => submitComment(item.id)}
                      onCancel={() => setReplyTo(null)}
                    />
                  </div>
                )}
                {item.replies.map((replyItem) => (
                  <div className="reply-card" key={replyItem.id}>
                    <span className="reply-mark">↳</span>
                    <CommentCard comment={replyItem} />
                  </div>
                ))}
              </article>
            ))
          ) : (
            <div className="comments-empty">첫 댓글을 남겨 대화를 시작해 보세요.</div>
          )}
        </div>
      </section>
    </>
  );
}

function CommentCard({ comment, children }) {
  return (
    <div className="comment-card">
      <div className="comment-author">
        <span>{comment.authorName.slice(0, 1)}</span>
        <div>
          <strong>{comment.authorName}</strong>
          <small>{formatDateTime(comment.createdAt)}</small>
        </div>
      </div>
      <p>{comment.content}</p>
      {children && <div className="comment-actions">{children}</div>}
    </div>
  );
}

function CommentForm({
  value,
  error,
  placeholder,
  buttonLabel,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="comment-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength="1000" />
      <div>
        <span className={error ? 'form-error' : ''}>{error || `${value.trim().length}/1000`}</span>
        <div>
          {onCancel && <button type="button" onClick={onCancel}>취소</button>}
          <button className="board-primary" type="submit">{buttonLabel}</button>
        </div>
      </div>
    </form>
  );
}

function PostEditor({ data, postId, onCancel, onSaved }) {
  const post = postId ? getPost(data, postId) : null;
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const isEdit = Boolean(postId);

  if (isEdit && !post) {
    return (
      <section className="board-panel board-not-found">
        <h1>수정할 게시글을 찾을 수 없습니다.</h1>
        <button className="board-primary" type="button" onClick={onCancel}>돌아가기</button>
      </section>
    );
  }

  if (isEdit && post.authorId !== CURRENT_USER.id) {
    return (
      <section className="board-panel board-not-found">
        <span>403</span>
        <h1>작성자만 수정할 수 있습니다.</h1>
        <p>현재 사용자는 {CURRENT_USER.name}입니다.</p>
        <button className="board-primary" type="button" onClick={onCancel}>돌아가기</button>
      </section>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    const result = isEdit
      ? updatePost(data, postId, { title, content })
      : createPost(data, { title, content });
    if (!result.ok) {
      setErrors(result.errors || {});
      setMessage(result.message || '입력 내용을 확인해 주세요.');
      return;
    }
    onSaved(result.data, result.post);
  };

  return (
    <section className="board-panel editor-panel">
      <div className="editor-heading">
        <p className="board-kicker">{isEdit ? 'EDIT POST' : 'NEW POST'}</p>
        <h1>{isEdit ? '게시글 수정' : '새 게시글 작성'}</h1>
        <p>제목은 100자, 내용은 10,000자까지 입력할 수 있습니다.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          <span>제목</span>
          <input
            value={title}
            maxLength="100"
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: '' }));
              setMessage('');
            }}
            placeholder="제목을 입력하세요."
          />
          <small className={errors.title ? 'form-error' : ''}>{errors.title || `${title.length}/100`}</small>
        </label>
        <label>
          <span>내용</span>
          <textarea
            value={content}
            maxLength="10000"
            onChange={(event) => {
              setContent(event.target.value);
              setErrors((current) => ({ ...current, content: '' }));
              setMessage('');
            }}
            placeholder="내용을 입력하세요."
          />
          <small className={errors.content ? 'form-error' : ''}>{errors.content || `${content.length}/10000`}</small>
        </label>
        {message && <div className="editor-message">{message}</div>}
        <div className="editor-actions">
          <button type="button" onClick={onCancel}>취소</button>
          <button className="board-primary" type="submit">{isEdit ? '수정 저장' : '게시글 작성'}</button>
        </div>
      </form>
    </section>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
