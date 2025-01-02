import json

def get_anime_name(filepath):
    """アニメ名を JSON ファイルから取得"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def submit_anime(filepath, data):
    """JSON ファイルにデータを保存"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def update():
    # デフォルトのデータセットを構築
    month=["01","02","03","04","05","06","07","08","09","10","11","12"]
    default_dataset = {year: {m: 0 for m in month} for year in range(2005, 2026)}

    # アニメデータを取得
    anime = get_anime_name('./data/animes_test.json')

    # データセットを追加
    for i, anime_entry in enumerate(anime):
        anime[i]["viewCount"] = default_dataset.copy()
        anime[i]["likeCount"] = default_dataset.copy()
        anime[i]["commentCount"] = default_dataset.copy()
        anime[i]["videoCount"] = default_dataset.copy()


    # 新しいアニメデータを保存
    submit_anime('./data/animes_base.json', anime)
def createdata():
    # アニメデータと動画データを取得
    anime = get_anime_name('./data/animes_base.json')
    video = get_anime_name('./data/video.json')

    # 動画データを処理
    for a in anime:
        for v in video["videos"]:
            # 必要なキーが存在するかチェック
            if not isinstance(v, dict) or "animename" not in v or "videos_details" not in v:
                print(f"無効な動画データ: {v}")
                continue
            
            details = v["videos_details"]

            # 必要なキーが存在するか確認
            if "publishedAt" not in details or "viewCount" not in details:
                print(f"詳細データの欠損: {details}")
                continue

            # アニメ名が一致する場合
            if a["name"] == v["animename"]:
                try:
                    # 公開日をパースして年と月を抽出
                    date = details["publishedAt"].split("T")[0].split("-")  # ['YYYY', 'MM', 'DD']
                    year, month = date[0], date[1]

                    # 再生回数を加算（整数変換を忘れない）
                    a["viewCount"][year][month] += int(details["viewCount"])
                    a["likeCount"][year][month] += int(details["likeCount"])
                    a["commentCount"][year][month] += int(details["commentCount"])
                    a["videoCount"][year][month] += 1
                    
                    
                except Exception as e:
                    print(f"データ処理中のエラー: {e}, データ: {details}")

    # データ保存
    submit_anime('./data/animes_tests.json', anime)
import json
import requests
import time
import os
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

API_KEYS = os.getenv("API_KEY").split(',')
CURRENT_API_INDEX = 0

SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos'

STATE_FILE = './data/animes_tests.json'

def switch_api_key():
    """次のAPIキーに切り替える"""
    global CURRENT_API_INDEX
    CURRENT_API_INDEX += 1
    if CURRENT_API_INDEX >= len(API_KEYS):
        print("すべてのAPIキーのクオータを超過しました。スクリプトを終了します。")
        exit()
    print(f"APIキーを切り替えました。新しいキーのインデックス: {CURRENT_API_INDEX}")

def get_video_ids(keyword, page_token):
    """YouTube API からビデオ ID を取得"""
    global CURRENT_API_INDEX
    query = keyword["name"]
    params = {
        'part': 'id,snippet',
        'q': f'"{query}"',
        'maxResults': 50,
        'pageToken': page_token,
        'order': 'relevance',
        'type': 'video',
        'videoCategoryId': 1,
        'key': API_KEYS[CURRENT_API_INDEX]
    }
    response = requests.get(SEARCH_URL, params=params)
    if response.status_code == 403:
        print("Quota exceeded for the current API key.")
        switch_api_key()
        return get_video_ids(keyword, page_token)
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    return response.json()

def get_video_details(video_ids):
    """YouTube API からビデオの詳細情報を取得"""
    global CURRENT_API_INDEX
    params = {
        'part': 'snippet,statistics',
        'id': ','.join(video_ids),
        'key': API_KEYS[CURRENT_API_INDEX]
    }
    response = requests.get(VIDEO_URL, params=params)
    if response.status_code == 403:
        print("Quota exceeded for the current API key.")
        switch_api_key()
        return get_video_details(video_ids)
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    return response.json()

def process_video_data(state, video_data, keyword):
    """取得したビデオデータを整形"""
    shortnames = [name for name in keyword["shortname"] if name]
    for item in video_data['items']:
        title = item['snippet']['title']
        description = item['snippet']['description']
        match = keyword["name"] in title or keyword["name"] in description or any(name in title or name in description for name in shortnames)

        if match:
            date = item['snippet']['publishedAt'].split("T")[0].split("-")
            year, month = date[0], date[1]
            state["anime_data"][DATA_KEY]['viewCount'][year][month] += int(item['statistics'].get('viewCount', 0))
            state["anime_data"][DATA_KEY ]['likeCount'][year][month] += int(item['statistics'].get('likeCount', 0))
            state["anime_data"][DATA_KEY ]['commentCount'][year][month] += int(item['statistics'].get('commentCount', 0))
            state["anime_data"][DATA_KEY ]['videoCount'][year][month] += 1
    return state

def update_data_key(data_key):
    """環境変数の DATA_KEY を更新"""
    os.environ["DATA_KEY"] = str(data_key)

def save_state(state):
    """状態を保存"""
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=4)

def get_anime_name(filepath=STATE_FILE):
    """アニメ名を JSON ファイルから取得"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    global DATA_KEY  # グローバル変数として扱う
    state = get_anime_name(STATE_FILE)
    DATA_KEY = state["last_id"]
    page_token = state['nextPageToken']
    keywords = state["anime_data"]

    with ThreadPoolExecutor(max_workers=5) as executor:
        while DATA_KEY < len(keywords):
            keyword = keywords[DATA_KEY]
            print(f"Processing keyword index: {DATA_KEY}, name: {keyword['name']}")

            # APIリクエストを並行して行う
            while True:
                video_id_data = get_video_ids(keyword, page_token)
                if video_id_data is None:
                    print("APIクオータが超過しました。スクリプトを終了します。")
                    return

                video_ids = [item['id']['videoId'] for item in video_id_data['items'] if item['id']['kind'] == 'youtube#video']
                if not video_ids:
                    break

                # ビデオ詳細の取得とデータ処理を並列化
                video_details_data = get_video_details(video_ids)
                if video_details_data is None:
                    break

                # 並列処理で整形データを更新
                state = process_video_data(state, video_details_data, keyword)

                # 次ページのトークン取得
                page_token = video_id_data.get('nextPageToken')
                state['last_id'] = DATA_KEY
                state['nextPageToken'] = page_token

                # 状態を保存
                save_state(state)

                if not page_token:
                    break

                time.sleep(2)

            DATA_KEY += 1
            update_data_key(DATA_KEY)
            page_token = None

        state['last_id'] = DATA_KEY
        state['nextPageToken'] = None
        save_state(state)
        print("すべてのキーワードを処理しました。")

if __name__ == '__main__':
    main()
