from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import pairwise_distances

import json

with open('./data/animes_tests.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換

def genre():
    data=[]
    filedata=[]

    for i in datas:
        if i["genres"]!="不明":
            data.append({
        "title": i["name"],
        "genres": i["genres"].split(", ") # 2～5ジャンルをランダム選択
        })

# ワンホットエンコーディング
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform([item['genres'] for item in data])

# コサイン類似度を計算
    cosine_sim_matrix = cosine_similarity(genre_matrix)

# k-means クラスタリング
    kmeans = KMeans(n_clusters=1, random_state=42, n_init='auto')  # クラスタ数を3に設定
    kmeans_labels = kmeans.fit_predict(genre_matrix)

# PCA による次元削減
    pca = PCA(n_components=2)
    reduced_data = pca.fit_transform(genre_matrix)



    for i in range(len(reduced_data)):
        filedata.append(
        {"animename":datas[i]["name"],
         "coverImage":datas[i]["coverImage"],
         "x":float(reduced_data[i, 0]),
         "y":float(reduced_data[i, 1]),
         "year": datas[i]["year"],
         "n": datas[i]["n"],
         "color":"blue"
         })
    with open('./data/node.json', 'w', encoding='utf-8') as f:
        json.dump(filedata, f, ensure_ascii=False, indent=4)


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
    
    dist_matrix = pairwise_distances(anime_vectors, metric='euclidean')
    
    # U-MAPを適用して2次元に削減
    pca = PCA(n_components=2)
    anime_mds = pca.fit_transform(dist_matrix)
    filedata=[]
    for i in range(len(anime_mds)):
        filedata.append(
        {"animename":datas["anime_data"][i]["name"],
         "coverImage":datas["anime_data"][i]["coverImage"],
         "x":float(anime_mds[i, 0]),
         "y":float(anime_mds[i, 1]),
         "year": datas["anime_data"][i]["year"],
         "n": datas["anime_data"][i]["n"],
         "description":datas["anime_data"][i]["description"],
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

