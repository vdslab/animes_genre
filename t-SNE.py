from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer

import json

with open('./data/animes.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換


data=[]

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
kmeans = KMeans(n_clusters=1, random_state=42, n_init='auto')  # クラスタ数を適切に設定
kmeans_labels = kmeans.fit_predict(genre_matrix)

# t-SNE による次元削減
tsne = TSNE(n_components=2, random_state=42, init='random', perplexity=30, metric="cosine")
reduced_data = tsne.fit_transform(genre_matrix)

# 結果を DataFrame にまとめる
df = pd.DataFrame({
    "Genres": [", ".join(item['genres']) for item in data],
    "Cluster": kmeans_labels,
    "t-SNE Dim 1": reduced_data[:, 0],
    "t-SNE Dim 2": reduced_data[:, 1]
})

# クラスタリング結果を可視化
plt.figure(figsize=(12, 10))
for cluster_label in set(kmeans_labels):
    cluster_points = reduced_data[kmeans_labels == cluster_label]
    plt.scatter(
        cluster_points[:, 0], cluster_points[:, 1],
        label=f'Cluster {cluster_label}', alpha=0.7
    )



plt.title("k-means Anime Genre Clustering with 100 Data Points (Cosine Similarity)")
plt.xlabel("t-SNE Dimension 1")
plt.ylabel("t-SNE Dimension 2")
plt.legend()
plt.grid(True)
plt.show()
