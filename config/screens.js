/**
 * 5つの画面シーン、画面画像、クリック領域の設定
 * 1画面に複数画像を登録するときは images に項目を追加します。
 * Mermaid図では nodeId が四角いページノードとクリック領域を接続します。
 * 画像形式の遷移図では x / y / width / height を割合（%）で指定できます。
 */
window.SCREEN_FLOW_CONFIG = {
  flows: [
    {
      id: "main-flow",
      number: "01",
      name: "全体画面遷移",
      type: "mermaid",
      alt: "美容クリニック求人.comの全体画面遷移図",
      source: `%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#FFFFFF",
    "primaryBorderColor": "#EB6E0D",
    "primaryTextColor": "#222222",
    "lineColor": "#666666"
  },
  "flowchart": {
    "nodeSpacing": 85,
    "rankSpacing": 115,
    "curve": "basis",
    "padding": 25
  }
}}%%

flowchart TB

TOP["画像01｜TOPページ"]
SERVICE["画像02｜サービス紹介"]
INTERVIEW_LIST["画像03｜インタビュー一覧"]
INTERVIEW_DETAIL["画像04｜インタビュー詳細"]
COLUMN_LIST["画像05｜コラム一覧"]
COLUMN_DETAIL["画像06｜コラム詳細"]
REGISTER["画像07｜新規会員登録"]
LOGIN["画像11｜ログイン"]
JOB_AUTH{"ログイン済み？"}
JOB_SEARCH_LIST["画像17｜求人検索・一覧ページ"]
JOB_DETAIL["画像19｜求人詳細"]
CLINIC["画像20｜クリニック詳細"]
REVIEW_AUTH{"ログイン済み？"}
REVIEW_LIST["画像21｜口コミ一覧"]
REVIEW_DETAIL["画像22｜口コミ詳細"]
REVIEW_POST["画像23〜25｜口コミ投稿"]
FAVORITE["画像26｜お気に入り"]
APPLY["画像27〜29｜応募"]
MESSAGE["画像30〜31｜メッセージ"]
MYPAGE["画像32｜マイページTOP"]
APPLICATION["画像33｜応募管理"]
PROFILE["画像34｜プロフィール"]
SETTINGS["画像35〜39｜アカウント設定"]
FAQ["画像40｜よくある質問"]
CONTACT["画像41〜43｜お問い合わせ"]
AUTH_GATE["画像44｜ログイン・会員登録誘導"]
ERROR["画像45・46｜404 / エラー"]
OFFICIAL["外部｜クリニック公式HP"]

TOP --> SERVICE
TOP --> INTERVIEW_LIST
INTERVIEW_LIST --> INTERVIEW_DETAIL
TOP --> COLUMN_LIST
COLUMN_LIST --> COLUMN_DETAIL
TOP -->|"求人を探す"| JOB_AUTH
JOB_AUTH -->|"ログイン済み"| JOB_SEARCH_LIST
JOB_AUTH -->|"未ログイン"| AUTH_GATE
JOB_SEARCH_LIST --> JOB_DETAIL
JOB_DETAIL --> CLINIC
JOB_DETAIL --> APPLY
APPLY --> MESSAGE
TOP -->|"口コミを見る"| REVIEW_AUTH
REVIEW_AUTH -->|"ログイン済み"| REVIEW_LIST
REVIEW_AUTH -->|"未ログイン"| AUTH_GATE
REVIEW_LIST --> REVIEW_DETAIL
REVIEW_LIST --> REVIEW_POST
TOP --> REGISTER
TOP --> LOGIN
AUTH_GATE --> LOGIN
AUTH_GATE --> REGISTER
LOGIN -->|"遷移元なし"| MYPAGE
MYPAGE --> APPLICATION
MYPAGE --> MESSAGE
MYPAGE --> FAVORITE
MYPAGE --> PROFILE
MYPAGE --> SETTINGS
MYPAGE --> JOB_SEARCH_LIST
TOP --> FAQ
FAQ --> CONTACT
INTERVIEW_DETAIL -->|"求人あり・認証後"| JOB_DETAIL
INTERVIEW_DETAIL -->|"求人なし"| OFFICIAL
TOP -.->|"全ページ共通例外"| ERROR`,
      screens: [
        screen("TOP", "top", "01", "TOPページ", [image("デザイン", "./assets/screens/top.png")]),
        screen("SERVICE", "service", "02", "サービス紹介", [image("デザイン", "./assets/screens/02-service.png")]),
        screen("INTERVIEW_LIST", "interview-list", "03", "インタビュー一覧", [image("デザイン", "./assets/screens/interview-list.png")]),
        screen("INTERVIEW_DETAIL", "interview-detail", "04", "インタビュー詳細", [image("デザイン", "./assets/screens/interview-detail.png")]),
        screen("COLUMN_LIST", "column-list", "05", "コラム一覧", [image("デザイン", "./assets/screens/05-column-list.png")]),
        screen("COLUMN_DETAIL", "column-detail", "06", "コラム詳細", [image("デザイン", "./assets/screens/06-column-detail.png")]),
        screen("REGISTER", "register", "07", "新規会員登録", [image("デザイン", "./assets/screens/07-register.png")]),
        screen("LOGIN", "login", "11", "ログイン", [image("デザイン", "./assets/screens/11-login.png")]),
        screen("JOB_SEARCH_LIST", "job-search-list", "17", "求人検索・一覧ページ", [image("デザイン", "./assets/screens/17-job-search-list.png")]),
        screen("JOB_DETAIL", "job-detail", "19", "求人詳細", [image("デザイン", "./assets/screens/19-job-detail.png")]),
        screen("CLINIC", "clinic-detail", "20", "クリニック詳細", [image("デザイン", "./assets/screens/20-clinic-detail.png")]),
        screen("REVIEW_LIST", "review-list", "21", "口コミ一覧", [image("デザイン", "./assets/screens/21-review-list.png")]),
        screen("REVIEW_DETAIL", "review-detail", "22", "口コミ詳細", [image("デザイン", "./assets/screens/22-review-detail.png")]),
        screen("REVIEW_POST", "review-post", "23–25", "口コミ投稿", [
          image("入力", "./assets/screens/23-review-post-input.png"),
          image("確認", "./assets/screens/24-review-post-confirm.png"),
          image("完了", "./assets/screens/25-review-post-complete.png")
        ]),
        screen("FAVORITE", "favorite", "26", "お気に入り", [image("デザイン", "./assets/screens/26-favorite.png")]),
        screen("APPLY", "apply", "27–29", "応募", [
          image("入力", "./assets/screens/27-apply-input.png"),
          image("確認", "./assets/screens/28-apply-confirm.png"),
          image("完了", "./assets/screens/29-apply-complete.png")
        ]),
        screen("MESSAGE", "message", "30–31", "メッセージ", [
          image("一覧", "./assets/screens/30-message-list.png"),
          image("詳細", "./assets/screens/31-message-detail.png")
        ]),
        screen("MYPAGE", "mypage", "32", "マイページTOP", [image("デザイン", "./assets/screens/32-mypage.png")]),
        screen("APPLICATION", "application-management", "33", "応募管理", [image("デザイン", "./assets/screens/33-application-management.png")]),
        screen("PROFILE", "profile", "34", "プロフィール", [image("デザイン", "./assets/screens/34-profile.png")]),
        screen("SETTINGS", "settings", "35–39", "アカウント設定", [
          image("画像35", "./assets/screens/35-account-setting.png"),
          image("画像36", "./assets/screens/36-account-setting.png"),
          image("画像37", "./assets/screens/37-account-setting.png"),
          image("画像38", "./assets/screens/38-account-setting.png"),
          image("画像39", "./assets/screens/39-account-setting.png")
        ]),
        screen("FAQ", "faq", "40", "よくある質問", [image("デザイン", "./assets/screens/40-faq.png")]),
        screen("CONTACT", "contact", "41–43", "お問い合わせ", [
          image("入力", "./assets/screens/41-contact-input.png"),
          image("確認", "./assets/screens/42-contact-confirm.png"),
          image("完了", "./assets/screens/43-contact-complete.png")
        ]),
        screen("AUTH_GATE", "auth-gate", "44", "ログイン・会員登録誘導", [image("デザイン", "./assets/screens/44-auth-gate.png")]),
        screen("ERROR", "error", "45–46", "404 / エラー", [
          image("404", "./assets/screens/45-404.png"),
          image("エラー", "./assets/screens/46-error.png")
        ])
      ]
    },
    rasterFlow("top-job-search", "02", "TOP → 求人検索", "./assets/flowcharts/top-job-search.png"),
    rasterFlow("top-reviews", "03", "TOP → 口コミ", "./assets/flowcharts/top-reviews.png"),
    rasterFlow("top-mypage", "04", "TOP → マイページ", "./assets/flowcharts/top-mypage.png"),
    rasterFlow("application", "05", "応募", "./assets/flowcharts/application.png")
  ]
};

function image(label, path) {
  return { label: label, path: path };
}

function screen(nodeId, id, number, name, images) {
  return { nodeId: nodeId, id: id, number: number, name: name, images: images };
}

function rasterFlow(id, number, name, path) {
  return {
    id: id,
    number: number,
    name: name,
    type: "image",
    image: path,
    alt: name + "の画面遷移図",
    screens: []
  };
}

