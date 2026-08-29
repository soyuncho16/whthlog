# whthlog

CS 기초(OS·컴퓨터구조·네트워크·자료구조·알고리즘)를 실제 문제에 적용해 푼
트러블슈팅을 발행하는 공개 블로그. https://soyuncho16.github.io/whthlog/

- Astro + GitHub Pages. `main` 에 push 하면 GitHub Actions 가 자동 배포한다.
- 포스트 = `src/content/blog/*.md` 마크다운 파일 하나. 발행 = `git push`.
- frontmatter 는 `title`, `pubDate` 두 줄이면 충분하다 (나머지는 옵션, `POST_FORMAT.md` 참고).
- `pubDate` 는 시각까지 쓴다 (`'2026-07-24T14:30:00+09:00'`). 목록 순서와 이전/다음 글이 이 시각 하나로 정해진다. 시각을 모르면 `seriesOrder: 1, 2, 3` 으로 같은 날 안의 순서를 준다.
- `> **내 진단** ...` 인용문은 앰버 aside 로 강조된다 (다른 플랫폼에선 평범한 인용문으로 강등).
- 캡처·발행 자동화는 Claude Code 의 `/cs-ts` 스킬 (`tools/cs-ts-skill.md`).

## 로컬

```sh
npm install
npm run dev    # http://localhost:4321/whthlog/
npm run build
```
