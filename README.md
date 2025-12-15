# ポケモン ランダム表示 PWA

PokeAPI v2 を利用したシンプルな PWA。画面にランダムなポケモン画像を表示し、タップすると日本語（カタカナ・かな）名を表示。もう一度タップで次のランダム画像に切り替わります。

## 動かし方（ローカル）

macOS なら簡易サーバで動かせます。

```bash
cd pokeapi-app
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開きます。インストール可能な PWA として表示されます。

## ファイル構成

- index.html: 画面の骨格
- styles.css: スタイル
- app.js: ロジック（PokeAPI から取得、タップ処理）
- manifest.webmanifest: PWA マニフェスト
- service-worker.js: オフライン対応キャッシュ
- icons/: PWA アイコン（差し替え可能）

## 実装ポイント

- 画像は `pokemon/{id}` の `sprites.other['official-artwork'].front_default` を優先使用
- 日本語名は `pokemon-species/{id}` の `names[].language.name === 'ja-Hrkt'` を参照（カタカナ・ひらがなの表記）
- 画像がない個体は数回リトライしてスキップ
- クリック/Enter/Space キーで同様に操作可能でアクセシビリティ考慮

## デプロイのヒント

静的ホスティング（GitHub Pages, Netlify, Vercel など）にそのまま配置可能です。

# pokeapi-app
Pokemon quiz app by using pokeapi
