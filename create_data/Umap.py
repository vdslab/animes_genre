from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import umap
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer

import json

with open('./data/animes.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換


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

# UMAP による次元削減
umap_reducer = umap.UMAP(n_components=2, random_state=42, metric='cosine')
reduced_data = umap_reducer.fit_transform(genre_matrix)

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

# # クラスタリング結果を可視化
# plt.figure(figsize=(12, 10))
# for cluster_label in set(kmeans_labels):
#     cluster_points = reduced_data[kmeans_labels == cluster_label]
#     plt.scatter(
#         cluster_points[:, 0], cluster_points[:, 1],
#         label=f'Cluster {cluster_label}', alpha=0.7
#     )

# # 各データポイントにタイトルを表示
# for i, title in enumerate(df['Title']):
#     plt.text(
#         reduced_data[i, 0], reduced_data[i, 1], title,
#         fontsize=8, alpha=0.6
#     )

# plt.title("k-means Anime Genre Clustering with UMAP")
# plt.xlabel("UMAP Dimension 1")
# plt.ylabel("UMAP Dimension 2")
# plt.legend()
# plt.grid(True)
# plt.show()

# # DataFrame を表示
# print(df.head(20))  # 最初の20件を表示
