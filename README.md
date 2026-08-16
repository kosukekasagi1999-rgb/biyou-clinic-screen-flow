# 美容クリニック求人.com 画面遷移図ビューアー

## 1. このツールの目的

「美容クリニック求人.com」の画面遷移図と、各ページのデザイン画像を並べて確認するための静的Webページです。上部で5つの画面シーンを切り替え、左側のページ枠をクリックすると右側のプレビューが切り替わります。1つのページに複数のデザイン画像を登録できます。1つ目の全体画面遷移図はMermaid定義から表示します。

HTML・CSS・JavaScriptだけで作られているため、特別な開発環境は必要ありません。

## 2. ローカルで確認する方法

最も簡単な方法は `index.html` をダブルクリックしてブラウザで開くことです。

より公開環境に近い状態で確認する場合は、Visual Studio Codeの「Live Server」拡張機能などでこのフォルダーを開いてください。

## 3. 新しい画面画像を追加する方法

1. PNGまたはJPG画像を `assets/screens/` に入れます。
2. `config/screens.js` をテキストエディターで開きます。
3. 対象シーンの `screens` の中に、既存項目を参考に画面名・画像パス・クリック位置を追加します。

### 1つの画面に複数画像を追加する

対象画面の `images` に画像を追加します。2枚以上ある場合は、プレビュー上部に切り替えボタンが自動表示されます。

```js
images: [
  { label: "PC版", path: "./assets/screens/example-pc.png" },
  { label: "スマートフォン版", path: "./assets/screens/example-sp.png" }
]
```

## 4. 画像を差し替える方法

`assets/screens/` にある同名ファイルを新しい画像で上書きしてください。ファイル名を変更しなければ、設定変更は不要です。

## 5. 新しいクリック領域を追加する方法

`config/screens.js` の `screens` に、次の形で項目を追加します。

```js
{
  id: "new-screen",
  number: "04",
  name: "新しい画面",
  images: [
    { label: "デザイン 1", path: "./assets/screens/new-screen.png" }
  ],
  x: 30,
  y: 40,
  width: 40,
  height: 8
}
```

`id` は重複しない英数字、`name` は表示名、`image` は画像の保存場所です。

## 6. クリック位置を調整する方法

画面右上の「クリック領域を表示」をONにすると、クリックできる範囲が薄いオレンジ色になります。

`config/screens.js` の値を調整してください。すべて遷移図全体に対する割合（%）です。

- `x`: 左端からの位置
- `y`: 上端からの位置
- `width`: 領域の横幅
- `height`: 領域の高さ

## 7. GitHub Pagesの公開方法

このプロジェクトには、GitHub Pagesへ自動公開する設定が含まれています。

1. GitHubで `biyou-clinic-screen-flow` という空のリポジトリを作成します。
2. このフォルダーのファイルをそのリポジトリへpushします。
3. GitHubのリポジトリ画面で `Settings` を開きます。
4. 左側の `Pages` を開きます。
5. `Build and deployment` の `Source` で `GitHub Actions` を選びます。
6. `Actions` タブの公開処理が完了すると、Pages画面に閲覧URLが表示されます。

## 8. 他のエンジニアが編集する方法

GitHubリポジトリの `Settings` → `Collaborators` からメンバーを招待します。招待された人はリポジトリを自分のPCへcloneし、編集内容をブランチへpushしてPull Requestを作成できます。

## フォルダー構成

```text
assets/
├─ flowcharts/        画面遷移図の画像
└─ screens/           各ページのデザイン画像
config/
└─ screens.js         画面名・画像パス・クリック位置
css/
└─ style.css          見た目
js/
└─ app.js             クリックとプレビュー切替
index.html            最初に開くファイル
```

画面シーンは `config/screens.js` の `flows` で管理します。現在は5シーン分の枠があり、2〜5番目は遷移図を追加すると使える準備状態です。1つ目はMermaidのノードIDと各画面の `nodeId` が自動的にクリック領域として接続されます。画像形式の遷移図では `assets/flowcharts/` に画像を置き、各シーンの `screens` にクリック領域を追加してください。

| 画面シーン | 遷移図の予定ファイル |
| --- | --- |
| 全体画面遷移 | `config/screens.js` 内のMermaid定義 |
| TOP → 求人検索 | `assets/flowcharts/top-job-search.png` |
| TOP → 口コミ | `assets/flowcharts/top-reviews.png` |
| TOP → マイページ | `assets/flowcharts/top-mypage.png` |
| 応募 | `assets/flowcharts/application.png` |

