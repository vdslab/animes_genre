from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import umap
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import pairwise_distances
import requests 
import json
import re

with open('./data/animes_tests.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換

def genre():
    data=[]
    filedata=[]

    for i in datas["anime_data"]:
        if i["genres"] != "不明":
            genres = i["genres"]
            if isinstance(genres, str):  # genres が文字列の場合
                genres = genres.split(", ")
            data.append({
                "title": i["name"],
                "genres": genres
            })

# ワンホットエンコーディング
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform([item['genres'] for item in data])

    # コサイン類似度を計算
    cosine_sim_matrix = cosine_similarity(genre_matrix)

# k-means クラスタリング
    kmeans = KMeans(n_clusters=1, random_state=42, n_init='auto')  # クラスタ数を3に設定
    kmeans_labels = kmeans.fit_predict(genre_matrix)

# UMAP による次元削減
    umap_reducer = umap.UMAP(n_components=2, random_state=42, metric='cosine')
    reduced_data = umap_reducer.fit_transform(genre_matrix)

    for i in range(len(reduced_data)):
        filedata.append(
        {"animename":datas["anime_data"][i]["name"],
         "coverImage":datas["anime_data"][i]["coverImage"],
         "shortname":datas["anime_data"][i]["shortname"],
         "x":float(reduced_data[i, 0]),
         "y":float(reduced_data[i, 1]),
         "year": datas["anime_data"][i]["year"],
         "n": datas["anime_data"][i]["n"],
         "description":fetch_description(datas["anime_data"][i]["name"],datas["anime_data"][i]["description"]),
         "startDate":datas["anime_data"][i]["startDate"],
         "endDate":datas["anime_data"][i]["endDate"],
         "studio":datas["anime_data"][i]["studio"],
        "link":datas["anime_data"][i]["link"],
        "viewCount":datas["anime_data"][i]["viewCount"],
        "likeCount":datas["anime_data"][i]["likeCount"],
        "commentCount":datas["anime_data"][i]["commentCount"],
        "videoCount":datas["anime_data"][i]["videoCount"],
         "color":"blue"
         })
    with open('./data/node.json', 'w', encoding='utf-8') as f:
        json.dump(filedata, f, ensure_ascii=False, indent=4)
        
def fetch_description(name,description):
    if description is None:
        description = ""  # Noneの場合は空文字列にする
    if description!= "":
        description = re.sub(r'<[^>]*>', '', description)
    else:
        return description
    
    url = f"https://script.google.com/macros/s/AKfycbxwZewBANl5EuM-pnpbTgMwGryNhDapa3aTYCtBSFf5XIOVzgPmSTTxkiw8bj2fChl-AA/exec?text={description}&source=en&target=ja"
    response = requests.get(url)
    if response.status_code == 200:
        try:
            # レスポンスがJSON形式か確認し、変換
            print(name)
            return response.json()
        except requests.exceptions.JSONDecodeError:
            print(f"JSONDecodeError: レスポンスの内容はJSON形式ではありません。レスポンス内容: {response.text}")
            return None
    else:
        # HTTPエラーの場合
        print(f"HTTPエラー {response.status_code}: {response.text}")
        return None
def calculate_jaccard_similarity_tags(tag_vectors):
    num_items = len(tag_vectors)
    similarity_matrix = np.zeros((num_items, num_items))

    # NumPy配列に変換して、ビット演算を行う
    tag_vectors = np.array(tag_vectors)  # リストをNumPy配列に変換

    for i in range(num_items):
        for j in range(num_items):
            # AND（共通部分）、OR（和集合）を計算
            intersection = np.sum(tag_vectors[i] & tag_vectors[j])  # 共通部分
            union = np.sum(tag_vectors[i] | tag_vectors[j])  # 和集合

            # ジャカード類似度の計算
            similarity_matrix[i, j] = intersection / union if union != 0 else 0  # 和集合が0のときは0とする

    return similarity_matrix
def tags():
    data=[]
    tag_name=[]

    for i in datas["anime_data"]:
        if i["tag"] != []:
            tag = i["tag"]
            data.append({
                "title": i["name"],
                "tag": tag
            })
            for t in tag:
                tag_name.append(t["name"])
    tag_list=list(set(tag_name))
    # タグごとのランクを特徴量として格納する
    anime_vectors = []
    for anime in datas["anime_data"]:
        vector = [0] * len(tag_list)  # タグ数分のゼロベクトル
        if anime["tag"]:
            for tag in anime["tag"]:
                idx = tag_list.index(tag["name"])  # タグ名のインデックス
                vector[idx] = tag["rank"]  # ランクを対応する位置に代入
        anime_vectors.append(vector)
    
    dist_matrix = calculate_jaccard_similarity_tags(anime_vectors)
    
    # U-MAPを適用して2次元に削減
    mds = umap.UMAP(n_components=2, random_state=42, metric='precomputed')
    anime_mds = mds.fit_transform(dist_matrix)
    filedata=[]

# ジッターを追加して重なりを軽減
    jitter_strength = 0.1  # ジッターの強さ（調整可能）
    anime_mds_jittered = anime_mds + np.random.normal(0, jitter_strength, anime_mds.shape)

# ジッター後の座標を利用
    for i in range(len(anime_mds_jittered)):
        filedata.append(
    {"animename": datas["anime_data"][i]["name"],
     "coverImage": datas["anime_data"][i]["coverImage"],
     "x": float(anime_mds_jittered[i, 0]),  # ジッターを適用したx
     "y": float(anime_mds_jittered[i, 1]),  # ジッターを適用したy
     "year": datas["anime_data"][i]["year"],
     "n": datas["anime_data"][i]["n"],
     "shortname": datas["anime_data"][i]["shortname"],
     "description": fetch_description(datas["anime_data"][i]["name"],datas["anime_data"][i]["description"]),
     "startDate": datas["anime_data"][i]["startDate"],
     "endDate": datas["anime_data"][i]["endDate"],
     "studio": datas["anime_data"][i]["studio"],
     "link": datas["anime_data"][i]["link"],
     "viewCount": datas["anime_data"][i]["viewCount"],
     "likeCount": datas["anime_data"][i]["likeCount"],
     "commentCount": datas["anime_data"][i]["commentCount"],
     "videoCount": datas["anime_data"][i]["videoCount"],
     "color": "blue"
    })


    with open('./public/data/node.json', 'w', encoding='utf-8') as f:
        json.dump(filedata, f, ensure_ascii=False, indent=4)

# # 可視化
#     plt.figure(figsize=(6, 6))
#     plt.scatter(anime_mds[:, 0], anime_mds[:, 1])

# # アニメの名前をプロット

#     plt.title("MDS Visualization of Anime Tags with Ranks")
#     plt.xlabel("Dimension 1")
#     plt.ylabel("Dimension 2")
#     plt.show()


tags()

# 3. ユークリッド距離を計算する関数
def calculate_genre_distance(genre_matrix):
    num_items = genre_matrix.shape[0]
    distance_matrix = np.zeros((num_items, num_items))
    for i in range(num_items):
        for j in range(num_items):
            # ユークリッド距離を計算
            distance_matrix[i, j] = np.linalg.norm((genre_matrix[i] - genre_matrix[j]) * 100)
    return distance_matrix
