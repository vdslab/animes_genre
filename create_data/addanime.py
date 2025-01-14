import requests
import json
import time

erranime = []

# AniList API URL
url = "https://graphql.anilist.co"
headers = {
    "Content-Type": "application/json"
}

# GraphQLクエリの定義
query = """
query ($page: Int, $perPage: Int, $startYear: FuzzyDateInt, $endYear: FuzzyDateInt) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(
      type: ANIME, 
      format: TV, 
      startDate_greater: $startYear,
      startDate_lesser: $endYear, 
      countryOfOrigin: JP
    ) {
      id
      title {
        romaji
        native
        english
      }
      synonyms
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
}
"""

def load_json(filepath):
    """JSONファイルを読み込み"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"anime_data": []}

def save_json(filepath, data):
    """JSONファイルにデータを保存"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def make_request_with_retry(url, query, variables, max_retries=5):
    retries = 0
    while retries < max_retries:
        response = requests.post(url, json={"query": query, "variables": variables})
        
        if response.status_code == 429:
            wait_time = int(response.headers.get("Retry-After", 60))
            print(f"Too many requests. Retrying after {wait_time} seconds...")
            time.sleep(wait_time)
            retries += 1
        elif response.status_code == 200:
            return response.json()
        else:
            print(f"Request failed with status code {response.status_code}")
            break
    return None

def transformdata(animedata, year, n, existing_data):
    """アニメデータを変換し、重複を避ける"""
    # 重複チェック
    for test in existing_data["anime_data"]:
        if test["name"] == animedata["title"]["native"]:
            return None

    # 新しい ID を生成
    last_id = existing_data["anime_data"][-1]["id"] if existing_data["anime_data"] else 0
    default_dataset = {y: {str(m).zfill(2): 0 for m in range(1, 13)} for y in range(2005, 2026)}

    anime = {
        "id": last_id + 1,
        "name": animedata["title"]["native"],
        "shortname": animedata.get("synonyms", []),
        "description": animedata.get("description", "不明"),
        "format": animedata.get("format", "不明"),
        "episodes": animedata.get("episodes", "不明"),
        "duration": animedata.get("duration", "不明"),
        "startDate": animedata.get("startDate", {}),
        "endDate": animedata.get("endDate", {}),
        "genres": animedata.get("genres", []),
        "tag": animedata.get("tags", []),
        "studio": animedata.get("studios", {}).get("nodes", []),
        "link": animedata.get("externalLinks", []),
        "coverImage": animedata["coverImage"]["large"],
        "year": year,
        "n": n,
        "viewCount": default_dataset,
        "likeCount": default_dataset,
        "commentCount": default_dataset,
        "videoCount": default_dataset
    }
    print(anime["name"])
    return anime

def get_anime_data():
    """アニメ一覧を取得"""
    all_anime = load_json("./data/animes_tests.json")
    start_year = int(input("取得したいアニメの年代を入力してください 注意：2014~2024は入力しないこと(例: 2006): "))
    end_year = start_year + 1

    page = 1
    while True:
        variables = {
            "page": page,
            "perPage": 50,
            "startYear": start_year * 10000,
            "endYear": end_year * 10000
        }
        response_data = make_request_with_retry(url, query, variables)
        
        if response_data:
            page_data = response_data.get("data", {}).get("Page", {})
            media = page_data.get("media", [])
            for n, anime in enumerate(media, start=1):
                transformed_anime = transformdata(anime, start_year, n, all_anime)
                if transformed_anime:
                    all_anime["anime_data"].append(transformed_anime)

            if not page_data.get("pageInfo", {}).get("hasNextPage", False):
                break
            page += 1
        else:
            print("APIリクエストに失敗しました。")
            break

    save_json("./data/animes_tests.json", all_anime)
    print(erranime)

def main():
    get_anime_data()

if __name__ == '__main__':
    main()
