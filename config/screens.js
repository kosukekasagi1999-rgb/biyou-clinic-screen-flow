/**
 * 5つの画面シーン、画面画像、クリック領域の設定
 * 1画面に複数画像を登録するときは images に項目を追加します。
 * x / y / width / height は、遷移図画像全体に対する割合（%）です。
 */
window.SCREEN_FLOW_CONFIG = {
  flows: [
    {
      id: "top-interview",
      number: "01",
      name: "TOP → インタビュー",
      image: "./assets/flowcharts/top-interview.png",
      alt: "TOPページからインタビュー一覧、詳細へ進む画面遷移図",
      screens: [
        {
          id: "top",
          number: "01",
          name: "TOPページ",
          images: [
            { label: "デザイン 1", path: "./assets/screens/top.png" }
          ],
          x: 29,
          y: 6.2,
          width: 42,
          height: 8.5
        },
        {
          id: "interview-list",
          number: "02",
          name: "クリニックインタビュー一覧",
          images: [
            { label: "デザイン 1", path: "./assets/screens/interview-list.png" }
          ],
          x: 29,
          y: 48.2,
          width: 42,
          height: 8.5
        },
        {
          id: "interview-detail",
          number: "03",
          name: "クリニックインタビュー詳細",
          images: [
            { label: "デザイン 1", path: "./assets/screens/interview-detail.png" }
          ],
          x: 29,
          y: 84.3,
          width: 42,
          height: 8.5
        }
      ]
    },
    {
      id: "top-job-search",
      number: "02",
      name: "TOP → 求人検索",
      image: "./assets/flowcharts/top-job-search.png",
      alt: "TOPページから求人検索へ進む画面遷移図",
      screens: []
    },
    {
      id: "top-reviews",
      number: "03",
      name: "TOP → 口コミ",
      image: "./assets/flowcharts/top-reviews.png",
      alt: "TOPページから口コミへ進む画面遷移図",
      screens: []
    },
    {
      id: "top-mypage",
      number: "04",
      name: "TOP → マイページ",
      image: "./assets/flowcharts/top-mypage.png",
      alt: "TOPページからマイページへ進む画面遷移図",
      screens: []
    },
    {
      id: "application",
      number: "05",
      name: "応募",
      image: "./assets/flowcharts/application.png",
      alt: "求人への応募に関する画面遷移図",
      screens: []
    }
  ]
};

