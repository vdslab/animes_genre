import requests
import json
import time

API_KEY = 'AIzaSyDOQsn2qLX4zQ1OJbEcd712SNjjbylhF30'
#'AIzaSyDOQsn2qLX4zQ1OJbEcd712SNjjbylhF30'
#'AIzaSyAciVl5e8XIwILXZ1fTq62ykFYLcSD6YjA'
SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos'

def get_anime_name():
    with open('anime.json', 'r', encoding='utf-8') as f:
        j = json.load(f)
    return j

def get_video_ids(page_token, keyword, key):
    query = keyword["name"]
    params = {
        'part': 'id,snippet',
        'q': f'"{query}"',  # クエリを引用符で囲む
        'maxResults': 50,
        'pageToken': page_token,
        'order': 'relevance',
        'type': 'video',
        'videoCategoryId': 1,
        'key': API_KEY
    }
    response = requests.get(SEARCH_URL, params=params)
    if response.status_code == 403:
        print("Quota exceeded. Please try again later.")
        print(key)
        return None
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    return response.json()

def get_video_details(video_ids):
    params = {
        'part': 'snippet,statistics',
        'id': ','.join(video_ids),
        'key': API_KEY
    }
    response = requests.get(VIDEO_URL, params=params)
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    return response.json()

def transform_video_data(data, keyword):
    transformed_videos = []
    shortnames_before=keyword["shortname"]
    shortnames=[]
    for name in shortnames_before:
        if name!="":
            shortnames.append(name)
    

    for item in data['items']:
        if keyword["name"] in item['snippet']['title'] or keyword["name"] in item['snippet']["description"]:
            transformed_videos.append({
                "animename": keyword["name"],
                "videos_details": {
                    'videoId': item['id'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'thumbnailUrl': item['snippet']['thumbnails']['default']['url'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'viewCount': item['statistics'].get('viewCount', 0),
                    'likeCount': item['statistics'].get('likeCount', 0),
                    'commentCount': item['statistics'].get('commentCount', 0)
                }
            })
        else:
            for name in shortnames:
                if name in item['snippet']['title'] or name in item['snippet']["description"]:
                    transformed_videos.append({
                "animename": keyword["name"],
                "videos_details": {
                    'videoId': item['id'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'thumbnailUrl': item['snippet']['thumbnails']['default']['url'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'viewCount': item['statistics'].get('viewCount', 0),
                    'likeCount': item['statistics'].get('likeCount', 0),
                    'commentCount': item['statistics'].get('commentCount', 0)
                }
            })
    return transformed_videos

def save_state(data, filename='state.json'):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def load_state(filename='state.json'):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def main():
    state = load_state()
    page_token = state['nextPageToken'] if state else None
    all_videos = state['videos'] if state else []
    keywords = get_anime_name()
    count = 0

    for i in range(210, 215):
        while True:
            video_id_data = get_video_ids(page_token, keywords[i], i)
            if video_id_data is None:
                count += 1
                break
            video_ids = [item['id']['videoId'] for item in video_id_data['items'] if item['id']['kind'] == 'youtube#video']
            if not video_ids:
                break
            video_details_data = get_video_details(video_ids)
            if video_details_data is None:
                break
            transformed_videos = transform_video_data(video_details_data, keywords[i])
            all_videos.extend(transformed_videos)
            page_token = video_id_data.get('nextPageToken')
            save_state({
                'nextPageToken': page_token,
                'videos': all_videos
            })
            if not page_token:
                break
            time.sleep(1)
        if count > 0:
            break

    save_state({
        'nextPageToken': None,
        'videos': all_videos
    })

if __name__ == '__main__':
    main()
