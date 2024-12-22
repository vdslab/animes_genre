import requests
import json
import time

erranime=list()

# AniList API URL
url = "https://graphql.anilist.co"

# クエリの定義（タイトル指定）
query = query = '''
query ($search: String) {
  Media (search: $search, type: ANIME) {
    id
    title {
      romaji
      native
      english
    }
    description(asHtml: false)
    format
    episodes
    duration
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    genres
    tags {
      name
      rank
    }
    studios {
      nodes {
        name
      }
    }
    externalLinks {
      site
      url
    }
    coverImage {
      large
    }
  }
}
'''

def make_request_with_retry(url, query, variables, max_retries=5):
    retries = 0
    while retries < max_retries:
        response = requests.post(url, json={"query": query, "variables": variables})
        
        if response.status_code == 429:
            # 429エラーが発生した場合、一定時間待機してから再試行
            wait_time = int(response.headers.get("Retry-After", 60))  # Retry-After ヘッダーを確認
            print(f"Too many requests. Retrying after {wait_time} seconds...")
            time.sleep(wait_time)  # 待機
            retries += 1
        elif response.status_code == 200:
            return response.json()  # 成功した場合
        else:
            # 他のエラーが発生した場合
            print(f"Request failed with status code {response.status_code}")
            break
    return None


def transformdata(animes, year, n):
    # ユーザー入力のアニメタイトル
    anime_title = animes["title"]

    # クエリ変数の定義
    variables = {
        "search": anime_title  # ユーザーが入力したタイトル
    }

    # リトライ付きリクエスト
    response_data = make_request_with_retry(url, query, variables)

    if response_data:
        animedetail = response_data.get("data", {}).get("Media", None)
        
        if animedetail:
            # アニメデータの表示
            print(f"- 日本語タイトル: {animedetail['title']['native']}")
            print(f"- ジャンル: {', '.join(animedetail['genres'])}")
            print(f"- カバー画像URL: {animedetail['coverImage']['large']}")
        else:
            print("該当するアニメが見つかりませんでした。")
    else:
        erranime.append(anime_title)
        print("APIリクエストに失敗しました。")
        animedetail = None  # 失敗した場合はNoneを設定
  
    # anime データを作成
    anime = {
        "id": animes["id"],
        "name": animes["title"],
        "shortname": [
            animes["title_short1"],
            animes["title_short2"],
            animes["title_short3"],
            animes["twitter_hash_tag"]
        ],
        "description":animedetail["description"] if animedetail else "不明",
        "format":animedetail["format"] if animedetail else "不明",
        "episodes":animedetail["episodes"] if animedetail else "不明",
        "duration":animedetail["duration"] if animedetail else "不明",
        "startDate":animedetail["startDate"] if animedetail else "不明",
        "endDate":animedetail["endDate"] if animedetail else "不明",
        "genres": ', '.join(animedetail['genres']) if animedetail else "不明",
        "tag":animedetail["tags"] if animedetail else "不明",
        "studio":animedetail["studios"]["nodes"] if animedetail else "不明",
        "link":animedetail["externalLinks"] if animedetail else "不明",
        "coverImage": animedetail['coverImage']['large'] if animedetail else "不明",
        "year": year,
        "n": n
    }
    return anime

def get_anime_name():
    all_anime = []  # すべてのアニメ情報を保存するリスト

    for year in range(2014, 2025):
        for n in range(1, 5):
            response = requests.get(f'https://anime-api.deno.dev/anime/v1/master/{year}/{n}')
            if response.status_code == 200:
                anime_list = response.json()
                for anime in anime_list:
                    anime_data = transformdata(anime, year, n)
                    if anime_data:  # anime_dataがNoneでない場合のみ追加
                        all_anime.append(anime_data)  # アニメ情報をリストに追加
            else:
                print(f"Failed to retrieve data for {year} Q{n}: {response.status_code}")

    # すべてのアニメ情報をファイルに書き込む
    with open('./data/animes_test.json', 'w', encoding='utf-8') as f:
        json.dump(all_anime, f, ensure_ascii=False, indent=4)
    print(erranime)

def main():
    get_anime_name()

if __name__ == '__main__':
    main()
