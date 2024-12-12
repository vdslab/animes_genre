import requests
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

API_KEYS = os.getenv("API_KEY").split(',')
CURRENT_API_INDEX = 0  # 現在使用中のAPIキーのインデックス

SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos'

STATE_FILE = './data/video.json'  # 状態管理用ファイル


def switch_api_key():
    """次のAPIキーに切り替える"""
    global CURRENT_API_INDEX
    CURRENT_API_INDEX += 1
    if CURRENT_API_INDEX >= len(API_KEYS):
        print("すべてのAPIキーのクオータを超過しました。スクリプトを終了します。")
        exit()
    print(f"APIキーを切り替えました。新しいキーのインデックス: {CURRENT_API_INDEX}")


def get_anime_name(filepath='./data/animes.json'):
    """アニメ名を JSON ファイルから取得"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_video_ids(page_token, keyword):
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
        'key': API_KEYS[CURRENT_API_INDEX]  # 現在のAPIキーを使用
    }
    response = requests.get(SEARCH_URL, params=params)
    if response.status_code == 403:
        print("Quota exceeded for the current API key.")
        switch_api_key()
        return get_video_ids(page_token, keyword)  # 再帰的に次のAPIキーで試す
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    print(response)
    return response.json()


def get_video_details(video_ids):
    """YouTube API からビデオの詳細情報を取得"""
    global CURRENT_API_INDEX
    params = {
        'part': 'snippet,statistics',
        'id': ','.join(video_ids),
        'key': API_KEYS[CURRENT_API_INDEX]  # 現在のAPIキーを使用
    }
    response = requests.get(VIDEO_URL, params=params)
    if response.status_code == 403:
        print("Quota exceeded for the current API key.")
        switch_api_key()
        return get_video_details(video_ids)  # 再帰的に次のAPIキーで試す
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    return response.json()


def transform_video_data(data, keyword):
    """取得したビデオデータを整形"""
    transformed_videos = []
    shortnames = [name for name in keyword["shortname"] if name]

    for item in data['items']:
        print(item)
        title = item['snippet']['title']
        description = item['snippet']['description']
        match = keyword["name"] in title or keyword["name"] in description or any(name in title or name in description for name in shortnames)

        if match:
            transformed_videos.append({
                "animename": keyword["name"],
                "videos_details": {
                    'videoId': item['id'],
                    'title': title,
                    'description': description,
                    'thumbnailUrl': item['snippet']['thumbnails']['default']['url'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'viewCount': item['statistics'].get('viewCount', 0),
                    'likeCount': item['statistics'].get('likeCount', 0),
                    'commentCount': item['statistics'].get('commentCount', 0)
                }
            })
    return transformed_videos


def save_state(data, filename=STATE_FILE):
    """状態を保存"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def load_state(filename=STATE_FILE):
    """状態を読み込み"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "last_id":None,
            "nextPageToken": None,
            "videos": []
        }


def update_data_key(data_key):
    """環境変数の DATA_KEY を更新"""
    os.environ["DATA_KEY"] = str(data_key)


def main():
    global DATA_KEY  # グローバル変数として扱う
    state = load_state()
    print(state)
    DATA_KEY=state["last_id"]
    page_token = state['nextPageToken']
    all_videos = state['videos']

    keywords = get_anime_name()

    while DATA_KEY < len(keywords):
        keyword = keywords[DATA_KEY]
        print(f"Processing keyword index: {DATA_KEY}, name: {keyword['name']}")

        while True:
            # ビデオ ID の取得
            video_id_data = get_video_ids(page_token, keyword)
            if video_id_data is None:
                print("APIクオータが超過しました。スクリプトを終了します。")
                return

            video_ids = [item['id']['videoId'] for item in video_id_data['items'] if item['id']['kind'] == 'youtube#video']
            if not video_ids:
                break

            # ビデオ詳細の取得
            video_details_data = get_video_details(video_ids)
            if video_details_data is None:
                break

            # データの整形と保存
            transformed_videos = transform_video_data(video_details_data, keyword)
            all_videos.extend(transformed_videos)

            # 次ページのトークン取得
            page_token = video_id_data.get('nextPageToken')

            # 状態を保存
            save_state({
                'last_id':DATA_KEY,
                'nextPageToken': page_token,
                'videos': all_videos
            })

            if not page_token:  # 次ページがない場合
                break

            time.sleep(2)  # レートリミット対策で少し待機

        # 次のキーワードに進む
        DATA_KEY += 1
        update_data_key(DATA_KEY)  # 環境変数を更新
        page_token = None  # リセット

    # 最終的な状態を保存
    save_state({
        'last_id':DATA_KEY,
        'nextPageToken': None,
        'videos': all_videos
    })
    print("すべてのキーワードを処理しました。")


if __name__ == '__main__':
    main()
