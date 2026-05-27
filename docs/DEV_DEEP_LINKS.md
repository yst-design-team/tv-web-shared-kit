# Dev Deep Links

The app supports direct page opening through URL params. This is the fastest way
to inspect a page without navigating through the full interaction flow.

## Query Params

- `page=<pageId>`
- `overlay=epg-recommendation` for the waterfall recommendation overlay

Examples:

- [EPG 首页](http://127.0.0.1:5173/?page=waterfall)
- [EPG 找片浮层](http://127.0.0.1:5173/?page=waterfall&overlay=epg-recommendation)
- [节目单](http://127.0.0.1:5173/?page=schedule)
- [播放器](http://127.0.0.1:5173/?page=player)
- [AI 空间找片](http://127.0.0.1:5173/?page=aism)
- [刘德华专题](http://127.0.0.1:5173/?page=liudehua)
- [话题推荐](http://127.0.0.1:5173/?page=topic)
- [话题空间默认页](http://127.0.0.1:5173/?page=topic-landing)
- [音乐首页](http://127.0.0.1:5173/?page=music-home)

## Browser Console Helper

The app also exposes `window.__tvDemo` during development:

```js
window.__tvDemo.getState()
window.__tvDemo.getFocusKey()
window.__tvDemo.setPage('topic')
window.__tvDemo.setOverlay('epg-recommendation')
window.__tvDemo.setOverlay(null)
window.__tvDemo.setFocus('topic-landing-history')
```

This is meant for local debugging and smoke checks. Page metadata still lives in
[src/pageRegistry.ts](/Users/guo/Library/Application%20Support/Open%20Design/namespaces/release-stable/data/projects/c9a9fa5d-4630-4300-99c5-6bed8ae79648/src/pageRegistry.ts:1).
